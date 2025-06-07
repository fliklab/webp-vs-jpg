import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { resolveSourceFiles } from "./utils.js";

const bytesToKB = (bytes: number): string => (bytes / 1024).toFixed(2);

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
  const sourceFiles = await resolveSourceFiles(
    config.source,
    config.testCasesPath
  );

  let reportContent = await fs.readFile(reportPath, "utf-8");
  let resultsMarkdown = "";

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

    let tasksToRun: any[] = [];
    if (config.tasks) {
      tasksToRun = config.tasks;
    } else if (config.task_groups) {
      // (task_groups 로직은 현재 작업에 불필요하므로 간소화)
    }

    if (tasksToRun.length === 0) continue;

    resultsMarkdown += `### ${sourceFileName}\n\n`;
    resultsMarkdown += `| 속성 | 원본 (${sourceMetadata.format}) |\n`;
    resultsMarkdown += `|:---|:---|\n`;
    const sourcePreview = `<a href="./image/${sourceFileName}"><img src="./image/${sourceFileName}" width="128"></a>`;
    resultsMarkdown += `| 미리보기 | ${sourcePreview} |\n`;
    resultsMarkdown += `| 해상도 | ${sourceMetadata.width}x${sourceMetadata.height} |\n`;
    resultsMarkdown += `| 용량 | ${bytesToKB(sourceImageStats.size)} KB |\n\n`;

    resultsMarkdown += `**변환 결과**\n\n`;
    resultsMarkdown += `| 포맷 (옵션) | 해상도 | 용량 (원본 대비) | 미리보기 |\n`;
    resultsMarkdown += `|:---|:---|:---|:---|\n`;

    for (const task of tasksToRun) {
      const outputFilename = `${path.basename(
        sourceFileName,
        path.extname(sourceFileName)
      )}-${task.output_suffix}.${task.format}`;
      const outputPath = path.join(imageDir, outputFilename);

      if (await fs.pathExists(outputPath)) {
        const stats = await fs.stat(outputPath);
        const sizeKB = bytesToKB(stats.size);
        const sizeChange = (
          ((stats.size - sourceImageStats.size) / sourceImageStats.size) *
          100
        ).toFixed(2);

        const outputMetadata = await sharp(outputPath).metadata();

        const optionsStr = task.options
          ? ` (${Object.entries(task.options)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")})`
          : "";
        const formatWithOptions = `${task.format}${optionsStr}`;
        const resolutionStr = `${outputMetadata.width}x${outputMetadata.height}`;
        const capacityStr = `${sizeKB} KB (${
          +sizeChange > 0 ? "+" : ""
        }${sizeChange}%)`;
        const outputPreview = `<a href="./image/${outputFilename}"><img src="./image/${outputFilename}" width="128"></a>`;

        resultsMarkdown += `| ${formatWithOptions} | ${resolutionStr} | ${capacityStr} | ${outputPreview} |\n`;
      }
    }
    resultsMarkdown += `\n---\n\n`;
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
