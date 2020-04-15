import fs from "fs";
import path from "path";
import util from "util";
import { Log } from "vscode-test-adapter-util";
import { getJestConfigInDirectory } from "../helpers/utils";
import RepoParserBase from "./RepoParserBase";
import { RepoParser } from "./types";

// the following requires Node 8 minimum.
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);

class StandardParser extends RepoParserBase implements RepoParser {
  public type = "default";

  constructor(private workspaceRoot: string, private log: Log) {
    super();
  }

  public async getProjects() {
    const jestConfig = await getJestConfig(this.workspaceRoot);
    const setupFile = await getJestSetupFile(this.log, jestConfig);

    return Promise.resolve([
      {
        jestConfig,
        projectName: await getProjectName(this.workspaceRoot),
        rootPath: this.workspaceRoot,
        setupFile,
        tsConfig: await getTsConfig(this.workspaceRoot),
      },
    ]);
  }

  public isMatch() {
    return isStandard(this.workspaceRoot);
  }
}

const isStandard = async (workspaceRoot: string): Promise<boolean> => {
  // check that package.json and jest.config.js/ts exists.
  const packageJsonPath = path.resolve(workspaceRoot, "package.json");
  const jestConfig = path.resolve(workspaceRoot, "jest.config.js");

  return (await exists(packageJsonPath)) && (await exists(jestConfig));
};

const getProjectName = async (workspaceRoot: string): Promise<string> => {
  if (await exists(path.resolve(workspaceRoot, "package.json"))) {
    const buffer = readFile(path.resolve(workspaceRoot, "package.json"));
    const json = JSON.parse((await buffer).toString());
    return json.displayName || json.name;
  }

  return "default";
};

const getJestConfig = async (workspaceRoot: string): Promise<string | undefined> =>
  (await getJestConfigInDirectory(workspaceRoot)) ?? undefined;

const getTsConfig = async (workspaceRoot: string): Promise<string | undefined> => {
  const tsConfigPath = path.resolve(workspaceRoot, "tsconfig.json");
  if (await exists(tsConfigPath)) {
    return tsConfigPath;
  }

  return undefined;
};

const getJestSetupFile = async (log: Log, jestConfig?: string): Promise<string | undefined> => {
  if (jestConfig && (await exists(jestConfig))) {
    try {
      const buffer = await readFile(jestConfig);
      const config = JSON.parse(buffer.toString());
      return config.setupFiles[0] || config.setupFilesAfterEnv[0];
    } catch {
      log.error(`Error trying to parse Jest setup file: ${jestConfig}`);
    }
  }

  return undefined;
};

export { StandardParser };
