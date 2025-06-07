import { hideBin } from "yargs/helpers";
import sharp from "sharp";
import path from "path";
import fs from "fs-extra";

// Sharp의 옵션 인터페이스들을 확장성 있게 정의
interface ResizeOptions {
  width?: number;
  height?: number;
}

interface WebpOptions {
  quality?: number;
  lossless?: boolean;
}

interface JpegOptions {
  quality?: number;
}

interface PngOptions {
  quality?: number;
}

interface AvifOptions {
  quality?: number;
  speed?: number; // 0(느림, 고품질) ~ 8(빠름, 저품질)
}

// 변환 작업에 대한 인터페이스
interface ConversionTask {
  output_suffix: string;
  format: "webp" | "jpeg" | "png" | "avif";
  options: WebpOptions | JpegOptions | PngOptions | AvifOptions;
  resize?: ResizeOptions;
}

const convertImage = async (
  sourcePath: string,
  task: ConversionTask,
  outputDir: string
) => {
  const sourceFilename = path.basename(sourcePath, path.extname(sourcePath));
  const outputFilename = `${sourceFilename}-${task.output_suffix}.${task.format}`;
  const outputPath = path.join(outputDir, outputFilename);

  let image = sharp(sourcePath);

  // 리사이즈 옵션 적용
  if (task.resize) {
    image = image.resize(task.resize.width, task.resize.height);
  }

  // 포맷별 변환 옵션 적용
  switch (task.format) {
    case "webp":
      image = image.webp(task.options as WebpOptions);
      break;
    case "jpeg":
      image = image.jpeg(task.options as JpegOptions);
      break;
    case "png":
      image = image.png(task.options as PngOptions);
      break;
    case "avif":
      image = image.avif(task.options as AvifOptions);
      break;
  }

  await image.toFile(outputPath);
  console.log(`✅ Converted ${sourcePath} to ${outputPath}`);
};

// 메인 함수
const main = async () => {
  const yargs = (await import("yargs/yargs")).default;
  const argv = await yargs(hideBin(process.argv))
    .option("source", {
      alias: "s",
      type: "string",
      description: "원본 이미지 파일 경로",
      demandOption: true,
    })
    .option("task", {
      alias: "t",
      type: "string",
      description: "JSON 형식의 변환 작업 객체",
      demandOption: true,
    })
    .option("outputDir", {
      alias: "o",
      type: "string",
      description: "결과물이 저장될 디렉토리",
      demandOption: true,
    })
    .parseAsync();

  try {
    const task: ConversionTask = JSON.parse(argv.task);
    await fs.ensureDir(argv.outputDir);
    await convertImage(argv.source, task, argv.outputDir);
  } catch (error) {
    console.error("❌ Image conversion failed:", error);
    process.exit(1);
  }
};

main();
