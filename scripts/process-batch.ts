import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { convertImage, ConversionTask } from "./convert.js";
import { resolveSourceFiles } from "./utils.js";

// 설정 파일의 타입을 정의
interface BatchConfig {
  description: string;
  source?: string | string[];
  testCasesPath?: string;
  analysis_sets?: {
    name: string;
    path: string;
  }[];
  tasks?: ConversionTask[];
  task_groups?: {
    condition: {
      min_width?: number;
      max_width?: number;
      min_height?: number;
      max_height?: number;
      source_format?: "jpeg" | "png" | "webp" | "avif";
    };
    tasks: ConversionTask[];
  }[];
}

const processBatch = async (configPath: string, outputDir: string) => {
  const config: BatchConfig = await fs.readJson(configPath);
  const imageOutputDir = path.join(outputDir, "image");
  await fs.ensureDir(imageOutputDir);

  if (config.analysis_sets) {
    console.log(`Copying ${config.analysis_sets.length} analysis sets...`);
    for (const set of config.analysis_sets) {
      const sourceDir = set.path;
      const destDir = path.join(imageOutputDir, path.basename(sourceDir));
      await fs.copy(sourceDir, destDir);
      console.log(`Copied ${sourceDir} to ${destDir}`);
    }
    console.log("✅ Analysis sets copied.");
    return; // End processing here for this type of job
  }

  const sourceFiles = await resolveSourceFiles(
    config.source,
    config.testCasesPath
  );

  console.log(`Processing batch for ${sourceFiles.length} images...`);

  for (const sourceFile of sourceFiles) {
    console.log(`--- Processing source: ${sourceFile} ---`);
    const sourceFileName = path.basename(sourceFile);
    const destinationPath = path.join(imageOutputDir, sourceFileName);
    await fs.copy(sourceFile, destinationPath);

    const metadata = await sharp(destinationPath).metadata();
    let tasksToRun: ConversionTask[] = [];

    if (config.tasks) {
      tasksToRun = config.tasks;
    } else if (config.task_groups) {
      for (const group of config.task_groups) {
        const { condition, tasks } = group;
        const width = metadata.width || 0;
        const height = metadata.height || 0;
        const format = metadata.format;

        const isMatch =
          (!condition.min_width || width >= condition.min_width) &&
          (!condition.max_width || width <= condition.max_width) &&
          (!condition.min_height || height >= condition.min_height) &&
          (!condition.max_height || height <= condition.max_height) &&
          (!condition.source_format || format === condition.source_format);

        if (isMatch) {
          tasksToRun.push(...tasks);
        }
      }
    }

    console.log(`Found ${tasksToRun.length} tasks for ${sourceFileName}`);

    // source_task_suffix가 없는 task (1차 변환) 부터 실행
    const primaryTasks = tasksToRun.filter((task) => !task.source_task_suffix);
    const chainedTasks = tasksToRun.filter((task) => task.source_task_suffix);

    for (const task of primaryTasks) {
      await convertImage(destinationPath, task, imageOutputDir);
    }

    // 1차 변환 결과물을 입력으로 2차 변환 실행
    for (const task of chainedTasks) {
      const sourceTaskOutputFilename = `${path.basename(
        sourceFileName,
        path.extname(sourceFileName)
      )}-${task.source_task_suffix}.${
        (await sharp(destinationPath).metadata()).format === "jpeg"
          ? "jpg"
          : (await sharp(destinationPath).metadata()).format
      }`;
      // Note: This is a simplification. A robust implementation would need to know the *exact* format of the intermediate file.
      // Let's find the actual file extension of the source task's output.
      const potentialSourceExtensions = ["webp", "jpg", "jpeg", "png", "avif"];
      let inputForChainedTask = "";

      for (const ext of potentialSourceExtensions) {
        const intermediateFileName = `${path.basename(
          sourceFileName,
          path.extname(sourceFileName)
        )}-${task.source_task_suffix}.${ext}`;
        const intermediatePath = path.join(
          imageOutputDir,
          intermediateFileName
        );
        if (await fs.pathExists(intermediatePath)) {
          inputForChainedTask = intermediatePath;
          break;
        }
      }

      if (!inputForChainedTask) {
        console.warn(
          `[!] Chained task skipped: Input file for suffix '${task.source_task_suffix}' not found.`
        );
        continue;
      }

      await convertImage(inputForChainedTask, task, imageOutputDir);
    }
  }
  console.log("✅ Batch processing complete.");
};

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option("config", {
      type: "string",
      description: "실행할 실험의 JSON 설정 파일 경로",
      demandOption: true,
    })
    .option("outputDir", {
      type: "string",
      description: "결과물을 저장할 실험 디렉토리",
      demandOption: true,
    })
    .parseAsync();

  await processBatch(argv.config, argv.outputDir);
};

main().catch((err) => {
  console.error("❌ 배치 처리 중 오류 발생:", err);
  process.exit(1);
});
