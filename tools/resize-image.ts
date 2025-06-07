import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";

const resizeImage = async (
  sourcePath: string,
  size: number,
  outDir: string
) => {
  const sourceFileName = path.basename(sourcePath, path.extname(sourcePath));
  const ext = path.extname(sourcePath);
  const outPath = path.join(outDir, `${sourceFileName}_${size}x${size}${ext}`);

  await sharp(sourcePath).resize(size, size).toFile(outPath);

  console.log(`✅ Resized and saved to: ${outPath}`);
};

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option("source", {
      type: "string",
      description: "리사이즈할 원본 이미지 파일 경로",
      demandOption: true,
    })
    .option("sizes", {
      type: "string",
      description: "쉼표로 구분된 목표 크기 목록 (예: 256,512,1024)",
      default: "256,512,1024",
    })
    .option("outDir", {
      type: "string",
      description: "결과물을 저장할 디렉토리",
      demandOption: true,
    })
    .parseAsync();

  if (!(await fs.pathExists(argv.source))) {
    console.error(`❌ 원본 파일을 찾을 수 없습니다: ${argv.source}`);
    process.exit(1);
  }

  await fs.ensureDir(argv.outDir);

  const sizes = argv.sizes.split(",").map((s) => parseInt(s.trim(), 10));

  for (const size of sizes) {
    if (isNaN(size) || size <= 0) {
      console.warn(`경고: '${size}'는 유효한 크기가 아니므로 건너뜁니다.`);
      continue;
    }
    await resizeImage(argv.source, size, argv.outDir);
  }
};

main().catch((err) => {
  console.error("❌ 이미지 리사이즈 중 오류 발생:", err);
  process.exit(1);
});
