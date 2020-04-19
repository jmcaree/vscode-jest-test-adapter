import fs from "fs";
import path from "path";
import util from "util";
import { Log } from "vscode-test-adapter-util";
import { convertErrorToString, getJestConfigInDirectory } from "../utils";
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
  const jestConfig = await getJestConfigInDirectory(workspaceRoot);

  return (await exists(packageJsonPath)) && jestConfig !== null;
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
      if (config.setupFiles && config.setupFiles.length > 0) {
        // TODO what should we do if there is more than one file?
        return config.setupFiles[0];
      } else if (config.setupFilesAfterEnv && config.setupFilesAfterEnv.length > 0) {
        // TODO what should we do if there is more than one file?
        return config.setupFilesAfterEnv[0];
      }
      return undefined;
    } catch (error) {
      log.error(`Error trying to parse Jest setup file: ${jestConfig}`, convertErrorToString(error));
    }
  }

  return undefined;
};

export { StandardParser };
