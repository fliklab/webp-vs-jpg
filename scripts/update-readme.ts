import fs from "fs-extra";
import path from "path";

interface Experiment {
  number: string;
  name: string;
  reportPath: string;
  dirName: string;
}

const getExperimentTitle = async (reportPath: string): Promise<string> => {
  if (!(await fs.pathExists(reportPath))) {
    return "N/A";
  }
  const content = await fs.readFile(reportPath, "utf-8");
  const firstLine = content.split("\n")[0];
  // # 01. White Image Test -> 01. White Image Test
  return firstLine.replace("# ", "").trim();
};

const updateReadme = async () => {
  try {
    const rootDir = process.cwd();
    const experimentsPath = path.join(rootDir, "experiments");
    const files = await fs.readdir(experimentsPath);
    const experimentDirs = files.filter(
      (file) =>
        /^\d+-/.test(file) &&
        fs.statSync(path.join(experimentsPath, file)).isDirectory()
    );

    const experiments: Experiment[] = [];
    for (const dirName of experimentDirs) {
      const reportPath = path.join(experimentsPath, dirName, "report.md");
      const title = await getExperimentTitle(reportPath);
      const number = dirName.split("-")[0];

      experiments.push({
        number,
        name: title.substring(title.indexOf(" ") + 1), // "01. White Image Test" -> "White Image Test"
        reportPath: `./experiments/${dirName}/report.md`,
        dirName,
      });
    }

    // Sort by number
    experiments.sort((a, b) => parseInt(a.number) - parseInt(b.number));

    // Generate markdown table
    let table = "| 번호 | 실험 이름 | 리포트 |\n";
    table += "| :--- | :-------- | :----- |\n";
    for (const exp of experiments) {
      table += `| ${exp.number} | ${exp.name} | [Link](${exp.reportPath}) |\n`;
    }

    const readmePath = path.join(rootDir, "README.md");
    let readmeContent = await fs.readFile(readmePath, "utf-8");

    const tableRegex =
      /<!-- EXPERIMENT_LIST_START -->(.|\n)*<!-- EXPERIMENT_LIST_END -->/;
    readmeContent = readmeContent.replace(
      tableRegex,
      `<!-- EXPERIMENT_LIST_START -->\n${table}\n<!-- EXPERIMENT_LIST_END -->`
    );

    await fs.writeFile(readmePath, readmeContent);

    console.log("✅ README.md 파일이 성공적으로 업데이트되었습니다.");
  } catch (error) {
    console.error("❌ README.md 업데이트 중 오류가 발생했습니다:", error);
  }
};

updateReadme();
