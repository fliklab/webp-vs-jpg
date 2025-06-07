import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";

interface ImageInfo {
  filename: string;
  format: string;
  quality?: number;
  size: number; // in bytes
  sizeKB: string;
}

const getQualityFromFilename = (filename: string): number | undefined => {
  const match = filename.match(/_q(\d+)\./);
  return match ? parseInt(match[1], 10) : undefined;
};

const bytesToKB = (bytes: number): string => (bytes / 1024).toFixed(2);

const generateReport = async (experimentPath: string) => {
  const imageDir = path.join(experimentPath, "image");
  const reportPath = path.join(experimentPath, "report.md");

  if (!(await fs.pathExists(imageDir)) || !(await fs.pathExists(reportPath))) {
    console.error(
      `오류: 유효한 실험 폴더 경로가 아닙니다. 경로: ${experimentPath}`
    );
    process.exit(1);
  }

  const imageFiles = await fs.readdir(imageDir);
  const imageInfos: ImageInfo[] = [];

  for (const file of imageFiles) {
    const filePath = path.join(imageDir, file);
    const stats = await fs.stat(filePath);
    if (stats.isFile()) {
      imageInfos.push({
        filename: file,
        format: path.extname(file).substring(1),
        quality: getQualityFromFilename(file),
        size: stats.size,
        sizeKB: bytesToKB(stats.size),
      });
    }
  }

  const sourceImage = imageInfos.find((img) => img.quality === undefined);
  if (!sourceImage) {
    console.error(
      `오류: 원본 이미지를 찾을 수 없습니다. (파일명에 '_q'가 없는 파일)`
    );
    return;
  }

  const convertedImages = imageInfos.filter((img) => img.quality !== undefined);

  // Markdown 테이블 생성
  let table = `| 원본 | 변환 포맷 | 퀄리티 | 결과 파일명 | 용량 (KB) | 용량 변화 |\n`;
  table += `| :--- | :-------- | :----- | :---------- | :-------- | :-------- |\n`;

  // 원본 이미지 행 추가
  table += `| **${sourceImage.filename}** | (원본) | - | **${sourceImage.filename}** | **${sourceImage.sizeKB}** | - |\n`;

  // 변환된 이미지 행 추가
  for (const image of convertedImages) {
    const sizeChangeInBytes = image.size - sourceImage.size;
    const sizeChangePercentage = (
      (sizeChangeInBytes / sourceImage.size) *
      100
    ).toFixed(2);
    const sizeChangeFormatted = `${sizeChangePercentage}% (${
      sizeChangeInBytes > 0 ? "+" : ""
    }${bytesToKB(sizeChangeInBytes)} KB)`;
    table += `| ${sourceImage.filename} | ${image.format} | ${
      image.quality || "-"
    } | ${image.filename} | ${image.sizeKB} | ${sizeChangeFormatted} |\n`;
  }

  // report.md 파일 업데이트
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

const argv = yargs(hideBin(process.argv))
  .option("path", {
    alias: "p",
    type: "string",
    description: "리포트를 생성할 실험 폴더 경로",
    demandOption: true,
  })
  .parseSync();

generateReport(argv.path);
