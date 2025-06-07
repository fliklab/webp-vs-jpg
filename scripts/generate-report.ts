import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { resolveSourceFiles } from "./utils.js";
import { ConversionTask } from "./convert.js";

const bytesToKB = (bytes: number): string => (bytes / 1024).toFixed(2);

const findTaskBySuffix = (tasks: ConversionTask[], suffix: string) => {
  return tasks.find((t) => t.output_suffix === suffix);
};

const generateReport = async (experimentPath: string) => {
  const imageDir = path.join(experimentPath, "image");
  const reportPath = path.join(experimentPath, "report.md");

  const jsonFiles = (await fs.readdir(experimentPath)).filter((f) =>
    f.endsWith(".json")
  );
  if (jsonFiles.length === 0) {
    console.error(`오류: 설정 JSON 파일을 찾을 수 없습니다: ${experimentPath}`);
    process.exit(1);
  }
  const configPath = path.join(experimentPath, jsonFiles[0]);
  const config = await fs.readJson(configPath);

  let reportContent = await fs.readFile(reportPath, "utf-8");
  let resultsMarkdown = "";

  if (config.analysis_sets) {
    for (const set of config.analysis_sets) {
      resultsMarkdown += `### ${set.name}\n\n`;
      resultsMarkdown += `| 파일명 | 포맷 | 해상도 | 용량 |\n`;
      resultsMarkdown += `|:---|:---|:---|:---|\n`;

      const setDirName = path.basename(set.path);
      const imageSetDir = path.join(imageDir, setDirName);
      const files = await fs.readdir(imageSetDir);

      for (const file of files) {
        const filePath = path.join(imageSetDir, file);
        const stats = await fs.stat(filePath);
        const metadata = await sharp(filePath).metadata();
        const relativePath = path.join("image", setDirName, file);
        const preview = `<a href="./${relativePath}"><img src="./${relativePath}" width="128"></a>`;

        resultsMarkdown += `| ${preview} | ${metadata.format} | ${
          metadata.width
        }x${metadata.height} | ${bytesToKB(stats.size)} KB |\n`;
      }
      resultsMarkdown += `\n---\n\n`;
    }
  } else {
    const sourceFiles = await resolveSourceFiles(
      config.source,
      config.testCasesPath
    );
    for (const sourceFile of sourceFiles) {
      const sourceFileName = path.basename(sourceFile);
      // process-batch는 실험 폴더의 image 폴더에 원본을 복사해 둔다.
      const sourceImageCopyPath = path.join(imageDir, sourceFileName);

      if (!(await fs.pathExists(sourceImageCopyPath))) {
        console.warn(
          `경고: 복사된 원본 이미지를 찾을 수 없습니다: ${sourceImageCopyPath}`
        );
        continue;
      }

      const sourceImageStats = await fs.stat(sourceImageCopyPath);
      const sourceMetadata = await sharp(sourceImageCopyPath).metadata();

      resultsMarkdown += `### ${sourceFileName} (Original: ${bytesToKB(
        sourceImageStats.size
      )} KB)\n\n`;
      resultsMarkdown += `| Conversion Path | Format & Quality | Size | Change | Preview |\n`;
      resultsMarkdown += `|:---|:---|:---|:---|:---|\n`;

      const tasks = config.tasks as ConversionTask[];
      for (const task of tasks) {
        const outputFilename = `${path.basename(
          sourceFileName,
          path.extname(sourceFileName)
        )}-${task.output_suffix}.${task.format}`;
        const outputPath = path.join(imageDir, outputFilename);
        if (!(await fs.pathExists(outputPath))) continue;

        const stats = await fs.stat(outputPath);
        const sizeKB = bytesToKB(stats.size);

        let pathStr = `**Direct**<br>PNG -> ${task.format.toUpperCase()}`;
        let sizeChangeStr = `${(
          ((stats.size - sourceImageStats.size) / sourceImageStats.size) *
          100
        ).toFixed(2)}%`;

        if (task.source_task_suffix) {
          const sourceTask = findTaskBySuffix(tasks, task.source_task_suffix);
          if (sourceTask) {
            const sourceTaskFilename = `${path.basename(
              sourceFileName,
              path.extname(sourceFileName)
            )}-${sourceTask.output_suffix}.${sourceTask.format}`;
            const sourceTaskPath = path.join(imageDir, sourceTaskFilename);
            if (await fs.pathExists(sourceTaskPath)) {
              const sourceTaskStats = await fs.stat(sourceTaskPath);
              pathStr = `**Chained**<br>...${sourceTask.format.toUpperCase()} -> ${task.format.toUpperCase()}`;
              sizeChangeStr = `${(
                ((stats.size - sourceTaskStats.size) / sourceTaskStats.size) *
                100
              ).toFixed(2)}% vs previous`;
              sizeChangeStr += `<br>${(
                ((stats.size - sourceImageStats.size) / sourceImageStats.size) *
                100
              ).toFixed(2)}% vs original`;
            }
          }
        }

        const optionsStr = task.options ? `(q: ${task.options.quality})` : "";
        const formatWithOptions = `${task.format.toUpperCase()} ${optionsStr}`;
        const preview = `<a href="./image/${outputFilename}"><img src="./image/${outputFilename}" width="128"></a>`;

        resultsMarkdown += `| ${pathStr} | ${formatWithOptions} | ${sizeKB} KB | ${sizeChangeStr} | ${preview} |\n`;
      }
      resultsMarkdown += `\n---\n\n`;
    }
  }

  const tableRegex =
    /<!-- RESULT_TABLE_START -->(.|\n)*<!-- RESULT_TABLE_END -->/;
  reportContent = reportContent.replace(
    tableRegex,
    `<!-- RESULT_TABLE_START -->\n${resultsMarkdown.trimEnd()}\n<!-- RESULT_TABLE_END -->`
  );

  reportContent = reportContent.replace(
    /## 🖼️ 원본 이미지(.|\n)*?## 📊 변환 결과/,
    "## 📊 변환 결과"
  );

  await fs.writeFile(reportPath, reportContent);
  console.log(`✅ 리포트가 성공적으로 업데이트되었습니다: ${reportPath}`);
};

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option("path", {
      alias: "p",
      type: "string",
      description: "리포트를 생성할 실험 폴더 경로",
      demandOption: true,
    })
    .parseAsync();

  await generateReport(argv.path);
};

main().catch((err) => {
  console.error("❌ 리포트 생성 중 오류 발생:", err);
  process.exit(1);
});
