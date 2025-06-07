import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import sharp from "sharp";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

// Sharp의 옵션 인터페이스들을 확장성 있게 정의
export interface ResizeOptions {
  width?: number;
  height?: number;
}

export interface WebpOptions {
  quality?: number;
  lossless?: boolean;
}

export interface JpegOptions {
  quality?: number;
}

export interface PngOptions {
  quality?: number;
}

export interface AvifOptions {
  quality?: number;
  speed?: number; // 0(느림, 고품질) ~ 8(빠름, 저품질)
}

export interface ConversionTask {
  format: "jpeg" | "png" | "webp" | "avif";
  output_suffix: string;
  resize?: sharp.ResizeOptions;
  options?:
    | sharp.WebpOptions
    | sharp.JpegOptions
    | sharp.PngOptions
    | sharp.AvifOptions;
  source_task_suffix?: string;
}

export const convertImage = async (
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
      image = image.webp(task.options as sharp.WebpOptions);
      break;
    case "jpeg":
      image = image.jpeg(task.options as sharp.JpegOptions);
      break;
    case "png":
      image = image.png(task.options as sharp.PngOptions);
      break;
    case "avif":
      image = image.avif(task.options as sharp.AvifOptions);
      break;
  }

  await image.toFile(outputPath);
  console.log(`✅ Converted ${sourcePath} to ${outputPath}`);
};

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option("source", {
      alias: "s",
      type: "string",
      description: "변환할 원본 이미지 경로",
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
      description: "결과물을 저장할 디렉토리",
      demandOption: true,
    })
    .parseAsync();

  const task: ConversionTask = JSON.parse(argv.task);
  await convertImage(argv.source, task, argv.outputDir);
};

// 이 파일이 직접 실행될 때만 main 함수를 호출
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error("❌ 이미지 변환 중 오류 발생:", err);
    process.exit(1);
  });
}
