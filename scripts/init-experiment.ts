import fs from "fs-extra";
import path from "path";

const EXPERIMENTS_DIR = "experiments";

const getNextExperimentNumber = async (): Promise<string> => {
  const experimentsPath = path.join(process.cwd(), EXPERIMENTS_DIR);
  await fs.ensureDir(experimentsPath); // experiments 폴더가 없으면 생성
  const files = await fs.readdir(experimentsPath);
  const experimentDirs = files.filter(
    (file) =>
      /^\d+-/.test(file) &&
      fs.statSync(path.join(experimentsPath, file)).isDirectory()
  );

  if (experimentDirs.length === 0) {
    return "01";
  }

  const lastExperimentNum = experimentDirs
    .map((dir) => parseInt(dir.split("-")[0], 10))
    .sort((a, b) => b - a)[0];

  return (lastExperimentNum + 1).toString().padStart(2, "0");
};

const formatExperimentName = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, "-");
};

const createExperiment = async () => {
  const experimentNameArg = process.argv[2];
  if (!experimentNameArg) {
    console.error(
      '오류: 실험 이름을 입력해주세요. 예: npm run init-experiment -- "My New Experiment"'
    );
    process.exit(1);
  }

  try {
    const nextNumber = await getNextExperimentNumber();
    const formattedName = formatExperimentName(experimentNameArg);
    const experimentDirName = `${nextNumber}-${formattedName}`;
    const experimentPath = path.join(
      process.cwd(),
      EXPERIMENTS_DIR,
      experimentDirName
    );

    if (await fs.pathExists(experimentPath)) {
      console.error(`오류: 폴더 '${experimentDirName}'가 이미 존재합니다.`);
      process.exit(1);
    }

    // 1. 실험 폴더 및 image 서브폴더 생성
    await fs.mkdirp(path.join(experimentPath, "image"));

    // 2. template.md를 report.md로 복사
    const templatePath = path.join(process.cwd(), "template.md");
    const reportPath = path.join(experimentPath, "report.md");
    await fs.copy(templatePath, reportPath);

    // 3. report.md의 내용 수정
    let reportContent = await fs.readFile(reportPath, "utf-8");
    const title = experimentNameArg
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    reportContent = reportContent.replace(
      /{{EXPERIMENT_NAME}}/g,
      `${nextNumber}. ${title}`
    );
    reportContent = reportContent.replace(
      /{{BRIEF_DESCRIPTION}}/g,
      `About ${title}`
    );

    await fs.writeFile(reportPath, reportContent);

    console.log(`✅ 실험 '${experimentDirName}'가 성공적으로 생성되었습니다.`);
    console.log(`- 폴더: ${experimentPath}`);
    console.log(`- 리포트: ${reportPath}`);
  } catch (error) {
    console.error("❌ 실험 생성 중 오류가 발생했습니다:", error);
    process.exit(1);
  }
};

createExperiment();
