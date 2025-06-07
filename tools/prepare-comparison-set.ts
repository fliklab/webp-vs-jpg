import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";

const prepareSet = async (
  sourcePath: string,
  size: number,
  baseOutDir: string,
  jpgQuality: number,
  webpQuality: number
) => {
  const sizeDir = path.join(baseOutDir, size.toString());
  await fs.ensureDir(sizeDir);

  const baseName = `a_${size}`;
  const pngPath = path.join(sizeDir, `${baseName}.png`);
  const jpgPath = path.join(sizeDir, `${baseName}.jpg`);
  const webpPath = path.join(sizeDir, `${baseName}.webp`);

  const resizedImage = sharp(sourcePath).resize(size, size);

  // 1. Save as PNG
  await resizedImage.clone().png().toFile(pngPath);
  console.log(`✅ Generated: ${pngPath}`);

  // 2. Save as JPG
  await resizedImage.clone().jpeg({ quality: jpgQuality }).toFile(jpgPath);
  console.log(`✅ Generated: ${jpgPath}`);

  // 3. Save as WebP
  await resizedImage.clone().webp({ quality: webpQuality }).toFile(webpPath);
  console.log(`✅ Generated: ${webpPath}`);
};

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option("source", {
      type: "string",
      description: "원본 이미지 파일 경로",
      demandOption: true,
    })
    .option("sizes", {
      type: "string",
      description: "쉼표로 구분된 목표 크기 목록",
      default: "256,512,1024",
    })
    .option("outDir", {
      type: "string",
      description: "결과물을 저장할 기본 디렉토리",
      demandOption: true,
    })
    .option("jpgQuality", {
      type: "number",
      description: "JPG 품질",
      default: 80,
    })
    .option("webpQuality", {
      type: "number",
      description: "WebP 품질",
      default: 80,
    })
    .parseAsync();

  if (!(await fs.pathExists(argv.source))) {
    console.error(`❌ 원본 파일을 찾을 수 없습니다: ${argv.source}`);
    process.exit(1);
  }

  const sizes = argv.sizes.split(",").map((s) => parseInt(s.trim(), 10));

  for (const size of sizes) {
    if (isNaN(size) || size <= 0) {
      console.warn(`경고: '${size}'는 유효한 크기가 아니므로 건너뜁니다.`);
      continue;
    }
    console.log(`--- Processing for size: ${size}x${size} ---`);
    await prepareSet(
      argv.source,
      size,
      argv.outDir,
      argv.jpgQuality,
      argv.webpQuality
    );
  }
};

main().catch((err) => {
  console.error("❌ 이미지 세트 준비 중 오류 발생:", err);
  process.exit(1);
});
