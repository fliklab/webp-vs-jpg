import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";

const generateWhiteImage = async (size: number, outDir: string) => {
  const filePath = path.join(outDir, `white_${size}x${size}.png`);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(filePath);
  console.log(`✅ Generated: ${filePath}`);
};

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option("sizes", {
      type: "string",
      description: "쉼표로 구분된 이미지 크기 목록 (예: 64,128,256)",
      default: "64,128,256,512,1024",
    })
    .option("outDir", {
      type: "string",
      description: "이미지를 저장할 디렉토리",
      default: "sources/white",
    })
    .parseAsync();

  const sizes = argv.sizes.split(",").map((s) => parseInt(s.trim(), 10));
  await fs.ensureDir(argv.outDir);

  for (const size of sizes) {
    if (isNaN(size) || size <= 0) {
      console.warn(`경고: '${size}'는 유효한 크기가 아니므로 건너뜁니다.`);
      continue;
    }
    await generateWhiteImage(size, argv.outDir);
  }
};

main().catch((err) => {
  console.error("❌ 이미지 생성 중 오류 발생:", err);
  process.exit(1);
});
