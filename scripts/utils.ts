import fs from "fs-extra";
import path from "path";

export const resolveSourceFiles = async (
  source: string | string[] | undefined,
  testCasesPath: string | undefined
): Promise<string[]> => {
  if (testCasesPath) {
    const testCases = await fs.readJson(testCasesPath);
    return testCases.map((testCase: { path: string }) => testCase.path);
  }

  if (!source) {
    return [];
  }

  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  if (Array.isArray(source)) {
    return source;
  }
  if ((await fs.pathExists(source)) && (await fs.stat(source)).isDirectory()) {
    const allFiles = await fs.readdir(source);
    return allFiles
      .filter((file) =>
        imageExtensions.includes(path.extname(file).toLowerCase())
      )
      .map((file) => path.join(source, file));
  }
  return [source];
};
