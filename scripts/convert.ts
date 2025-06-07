import sharp from "sharp";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs-extra";

interface ConvertOptions {
  sourcePath: string;
  format: "jpeg" | "png" | "webp";
  quality?: number;
}

const convertImage = async (options: ConvertOptions) => {
  const { sourcePath, format, quality } = options;

  try {
    if (!(await fs.pathExists(sourcePath))) {
      console.error(`오류: 소스 파일을 찾을 수 없습니다. 경로: ${sourcePath}`);
      return;
    }

    const dir = path.dirname(sourcePath);
    const filename = path.basename(sourcePath, path.extname(sourcePath));

    const qualitySuffix = quality ? `_q${quality}` : "";
    const outputFilename = `${filename}${qualitySuffix}.${format}`;
    const outputPath = path.join(dir, outputFilename);

    const image = sharp(sourcePath);
    let convertedImage;

    switch (format) {
      case "jpeg":
        convertedImage = image.jpeg({ quality });
        break;
      case "png":
        convertedImage = image.png(); // PNG는 무손실 위주이므로 quality 옵션은 일반적으로 적게 사용됨
        break;
      case "webp":
        convertedImage = image.webp({ quality });
        break;
      default:
        console.error(
          "오류: 지원하지 않는 포맷입니다. (jpeg, png, webp 중 선택)"
        );
        return;
    }

    await convertedImage.toFile(outputPath);

    console.log(`✅ 이미지 변환 완료: ${outputPath}`);
  } catch (error) {
    console.error("❌ 이미지 변환 중 오류 발생:", error);
  }
};

const argv = yargs(hideBin(process.argv))
  .option("path", {
    alias: "p",
    type: "string",
    description: "변환할 이미지 파일 경로",
    demandOption: true,
  })
  .option("format", {
    alias: "f",
    type: "string",
    choices: ["jpeg", "png", "webp"],
    description: "변환할 이미지 포맷",
    demandOption: true,
  })
  .option("quality", {
    alias: "q",
    type: "number",
    description: "이미지 퀄리티 (1-100, jpeg/webp용)",
  })
  .parseSync();

convertImage({
  sourcePath: argv.path,
  format: argv.format as "jpeg" | "png" | "webp",
  quality: argv.quality,
});
