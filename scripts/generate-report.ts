import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";

interface ImageInfo {
  filename: string;
  size: number;
  sizeKB: string;
  task: Record<string, any>;
}

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

  const imageFiles = await fs.readdir(imageDir);
  const sourceImageStats = await fs.stat(
    path.join(imageDir, config.source.split("/").pop())
  );

  let table = `| 포맷 | 퀄리티/옵션 | 리사이즈 | 결과 파일명 | 용량 (KB) | 용량 변화 |\n`;
  table += `|:---|:---|:---|:---|:---|:---|\n`;

  const sourceSizeKB = bytesToKB(sourceImageStats.size);
  table += `| **(원본)** | - | - | **${config.source
    .split("/")
    .pop()}** | **${sourceSizeKB}** | - |\n`;

  for (const task of config.tasks) {
    const outputFilename = `${path.basename(
      config.source,
      path.extname(config.source)
    )}-${task.output_suffix}.${task.format}`;
    const outputPath = path.join(imageDir, outputFilename);

    if (await fs.pathExists(outputPath)) {
      const stats = await fs.stat(outputPath);
      const sizeKB = bytesToKB(stats.size);
      const sizeChange = (
        ((stats.size - sourceImageStats.size) / sourceImageStats.size) *
        100
      ).toFixed(2);

      const optionsStr = JSON.stringify(task.options);
      const resizeStr = task.resize ? JSON.stringify(task.resize) : "-";

      table += `| ${task.format} | \`${optionsStr}\` | \`${resizeStr}\` | ${outputFilename} | ${sizeKB} | ${sizeChange}% |\n`;
    }
  }

  let reportContent = await fs.readFile(reportPath, "utf-8");
  const tableRegex =
    /<!-- RESULT_TABLE_START -->(.|\n)*<!-- RESULT_TABLE_END -->/;
  reportContent = reportContent.replace(
    tableRegex,
    `<!-- RESULT_TABLE_START -->\n${table}\n<!-- RESULT_TABLE_END -->`
  );

  await fs.writeFile(reportPath, reportContent);

  console.log(`✅ 리포트가 성공적으로 업데이트되었습니다: ${reportPath}`);
};

const main = async () => {
  const yargs = (await import("yargs/yargs")).default;
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
