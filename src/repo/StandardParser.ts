import fs from "fs";
import path from "path";
import util from "util";
import RepoParserBase from "./RepoParserBase";
import { RepoParser } from "./types";

// the following requires Node 8 minimum.
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);

class StandardParser extends RepoParserBase implements RepoParser {
  public type = "default";

  public async getProjects() {
    const jestConfig = await getJestConfig();
    const setupFile = await getJestSetupFile(jestConfig);

    return Promise.resolve([
      {
        jestConfig,
        projectName: await getProjectName(),
        rootPath: path.dirname(jestConfig || __dirname),
        setupFile,
        tsConfig: await getTsConfig(),
      },
    ]);
  }

  public isMatch() {
    return isStandard();
  }
}

const isStandard = async (): Promise<boolean> => {
  // check that package.json and jest.config.js/ts exists.
  const packageJsonPath = path.resolve(__dirname, "package.json");
  const jestConfig = path.resolve(__dirname, "jest.config.js");

  return (await exists(packageJsonPath)) && (await exists(jestConfig));
};

const getProjectName = async (): Promise<string> => {
  if (await exists(".\\package.json")) {
    const buffer = readFile(".\\package.json");
    const json = JSON.parse((await buffer).toString());
    return json.displayName || json.name;
  }

  return "default";
};

const getJestConfig = async (): Promise<string | undefined> => {
  const tsConfigPath = path.resolve(__dirname, "jest.config.js");
  if (await exists(tsConfigPath)) {
    return tsConfigPath;
  }

  return undefined;
};

const getTsConfig = async (): Promise<string | undefined> => {
  const tsConfigPath = path.resolve(__dirname, "tsconfig.json");
  if (await exists(tsConfigPath)) {
    return tsConfigPath;
  }

  return undefined;
};

const getJestSetupFile = async (jestConfig?: string): Promise<string | undefined> => {
  if (jestConfig && (await exists(jestConfig))) {
    try {
      const buffer = await readFile(jestConfig);
      const config = JSON.parse(buffer.toString());
      return config.setupFiles[0] || config.setupFilesAfterEnv[0];
    } catch {
      // TODO log something.
      return undefined;
    }
  }

  return undefined;
};

export { StandardParser };
