import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { convertImage, ConversionTask } from "./convert.js";

// 설정 파일의 타입을 정의
interface BatchConfig {
  description: string;
  source: string | string[];
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

// 소스 경로를 해석하여 파일 목록을 반환하는 함수
const resolveSourceFiles = async (
  source: string | string[]
): Promise<string[]> => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  if (Array.isArray(source)) {
    return source;
  }
  if ((await fs.pathExists(source)) && (await fs.stat(source)).isDirectory()) {
    const allFiles = await fs.readdir(source);
    return allFiles
      .filter((file) =>
        imageExtensions.includes(path.extname(file).toLowerCase())
      )
      .map((file) => path.join(source, file));
  }
  return [source];
};

const processBatch = async (configPath: string, outputDir: string) => {
  const config: BatchConfig = await fs.readJson(configPath);
  const sourceFiles = await resolveSourceFiles(config.source);
  const imageOutputDir = path.join(outputDir, "image");
  await fs.ensureDir(imageOutputDir);

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
    for (const task of tasksToRun) {
      await convertImage(destinationPath, task, imageOutputDir);
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
