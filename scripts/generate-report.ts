import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";

const bytesToKB = (bytes: number): string => (bytes / 1024).toFixed(2);

// (이 함수는 process-batch.ts에도 있지만, 중복을 피하려면 공통 유틸로 분리하는 것이 좋습니다)
const resolveSourceFiles = async (
  source: string | string[],
  basePath: string
): Promise<string[]> => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  if (Array.isArray(source)) {
    return source;
  }
  const sourcePath = path.isAbsolute(source)
    ? source
    : path.join(basePath, source);
  if (
    (await fs.pathExists(sourcePath)) &&
    (await fs.stat(sourcePath)).isDirectory()
  ) {
    const allFiles = await fs.readdir(sourcePath);
    return allFiles
      .filter((file) =>
        imageExtensions.includes(path.extname(file).toLowerCase())
      )
      .map((file) => path.join(source, file)); // config에 명시된 상대 경로를 유지
  }
  return [source];
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
  // config의 source 경로는 프로젝트 루트 기준이므로, 이 스크립트의 실행 위치를 기준으로 경로를 다시 계산해야 할 수 있습니다.
  // 여기서는 config가 실험 폴더로 이동되었고, source 경로는 원본 위치를 가리킨다고 가정합니다.
  const config = await fs.readJson(configPath);

  // workspace root를 기준으로 source 파일 목록을 다시 해석합니다.
  const sourceFiles = await resolveSourceFiles(config.source, process.cwd());

  let reportContent = await fs.readFile(reportPath, "utf-8");
  let resultsMarkdown = "";

  for (const sourceFile of sourceFiles) {
    const sourceFileName = path.basename(sourceFile);
    const sourceImagePath = path.join(imageDir, sourceFileName);

    if (!(await fs.pathExists(sourceImagePath))) {
      console.warn(`경고: 원본 이미지를 찾을 수 없습니다: ${sourceImagePath}`);
      continue;
    }

    const sourceImageStats = await fs.stat(sourceImagePath);
    const sourceMetadata = await sharp(sourceImagePath).metadata();
    const sourceSizeKB = bytesToKB(sourceImageStats.size);

    resultsMarkdown += `### 원본: ${sourceFileName}\n\n`;
    resultsMarkdown += `| 속성 | 값 |\n`;
    resultsMarkdown += `|:---|:---|\n`;
    resultsMarkdown += `| 포맷 | ${sourceMetadata.format} |\n`;
    resultsMarkdown += `| 해상도 | ${sourceMetadata.width}x${sourceMetadata.height} |\n`;
    resultsMarkdown += `| 용량 | ${sourceSizeKB} KB |\n\n`;

    let table = `| 포맷 | 퀄리티/옵션 | 리사이즈 | 결과 파일명 | 용량 (KB) | 용량 변화 |\n`;
    table += `|:---|:---|:---|:---|:---|:---|\n`;

    // 이 부분은 config에 task가 어떻게 정의되었는지에 따라 동적으로 생성해야 합니다.
    // 여기서는 단순하게 config.tasks가 존재한다고 가정합니다.
    const tasks = config.tasks || []; // TODO: task_groups 지원 추가 필요
    for (const task of tasks) {
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
        const optionsStr = JSON.stringify(task.options || {});
        const resizeStr = task.resize ? JSON.stringify(task.resize) : "-";
        table += `| ${task.format} | \`${optionsStr}\` | \`${resizeStr}\` | ${outputFilename} | ${sizeKB} | ${sizeChange}% |\n`;
      }
    }
    resultsMarkdown += table + "\n---\n\n";
  }

  const tableRegex =
    /<!-- RESULT_TABLE_START -->(.|\n)*<!-- RESULT_TABLE_END -->/;
  reportContent = reportContent.replace(
    tableRegex,
    `<!-- RESULT_TABLE_START -->\n${resultsMarkdown}\n<!-- RESULT_TABLE_END -->`
  );

  // 단일 원본 이미지를 가정했던 상단 정보 테이블은 제거하거나 주석 처리합니다.
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
