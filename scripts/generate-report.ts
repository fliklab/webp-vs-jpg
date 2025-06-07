import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import { resolveSourceFiles } from "./utils.js";

const bytesToKB = (bytes: number): string => (bytes / 1024).toFixed(2);

interface TestCase {
  name: string;
  path: string;
}

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

  const testCases: TestCase[] = await fs.readJson(config.testCasesPath);

  let reportContent = await fs.readFile(reportPath, "utf-8");
  let resultsMarkdown = "### 결과 요약\n\n";
  resultsMarkdown += `| 파일명 | 포맷 | 해상도 | 용량 |\n`;
  resultsMarkdown += `|:---|:---|:---|:---|\n`;

  for (const testCase of testCases) {
    const sourceFileName = path.basename(testCase.path);
    const sourceImagePath = path.join(process.cwd(), testCase.path);

    if (!(await fs.pathExists(sourceImagePath))) {
      console.warn(`경고: 원본 이미지를 찾을 수 없습니다: ${sourceImagePath}`);
      continue;
    }

    const stats = await fs.stat(sourceImagePath);
    const metadata = await sharp(sourceImagePath).metadata();
    const relativePath = path.relative(experimentPath, sourceImagePath);

    const preview = `<a href="${relativePath}"><img src="${relativePath}" width="64"></a>`;

    resultsMarkdown += `| ${preview} | ${metadata.format} | ${metadata.width}x${
      metadata.height
    } | ${bytesToKB(stats.size)} KB |\n`;
  }

  const tableRegex =
    /<!-- RESULT_TABLE_START -->(.|\n)*<!-- RESULT_TABLE_END -->/;
  reportContent = reportContent.replace(
    tableRegex,
    `<!-- RESULT_TABLE_START -->\n${resultsMarkdown.trimEnd()}\n\n<!-- RESULT_TABLE_END -->`
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
