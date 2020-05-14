import fs from "fs";
import path from "path";
import util from "util";
import { Log } from "vscode-test-adapter-util";
import { getJestConfigInDirectory } from "../utils";
import { getProjectName, getTsConfig } from "./repoHelpers";
import RepoParserBase from "./RepoParserBase";
import { ProjectConfig, RepoParser } from "./types";

// the following requires Node 8 minimum.
const exists = util.promisify(fs.exists);

class StandardParser extends RepoParserBase implements RepoParser {
  public type = "default";

  constructor(workspaceRoot: string, log: Log, pathToJest: string) {
    super(workspaceRoot, log, pathToJest);
  }

  public async getProjects(): Promise<ProjectConfig[]> {
    const jestConfig = (await getJestConfigInDirectory(this.workspaceRoot)) ?? undefined;

    const { jestCommand, jestExecutionDirectory } = this.getJestCommandAndDirectory();

    return Promise.resolve([
      {
        jestCommand,
        jestConfig,
        jestExecutionDirectory,
        projectName: await getProjectName(this.workspaceRoot),
        rootPath: this.workspaceRoot,
        tsConfig: await getTsConfig(this.workspaceRoot),
      },
    ]);
  }

  public isMatch() {
    return isStandard(this.workspaceRoot);
  }
}

const isStandard = async (workspaceRoot: string): Promise<boolean> => {
  const packageJsonPath = path.resolve(workspaceRoot, "package.json");
  // TODO we should also check that the jest package is installed, or that we are using a globally installed one.
  // Otherwise, this may not be a Jest project.
  return await exists(packageJsonPath);
};

export { StandardParser };
