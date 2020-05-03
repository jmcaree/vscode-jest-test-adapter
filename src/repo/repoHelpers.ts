import fs from "fs";
import path from "path";
import util from "util";
import { Log } from "vscode-test-adapter-util";
import { convertErrorToString } from "../utils";

// the following requires Node 8 minimum.
const exists = util.promisify(fs.exists);
const readFile = util.promisify(fs.readFile);

const getProjectName = async (workspaceRoot: string): Promise<string> => {
  if (await exists(path.resolve(workspaceRoot, "package.json"))) {
    const buffer = readFile(path.resolve(workspaceRoot, "package.json"));
    const json = JSON.parse((await buffer).toString());
    return json.displayName || json.name;
  }

  return "default";
};

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

export { getProjectName, getTsConfig, getJestSetupFile };
