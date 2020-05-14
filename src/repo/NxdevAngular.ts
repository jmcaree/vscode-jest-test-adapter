import path from "path";
import { Log } from "vscode-test-adapter-util";
import { NxdevBase } from "./NxdevBase";
import { RepoParser } from "./types";

interface NxAngular {
  architect: {
    test: {
      builder: string;
      options: {
        jestConfig: string;
        tsConfig: string;
        setupFile?: string;
      };
    };
  };
}

class NxdevAngular extends NxdevBase<NxAngular> implements RepoParser {
  public type = "Nx.dev Angular";

  protected configFileName = "angular.json";

  constructor(workspaceRoot: string, log: Log, pathToJest: string) {
    super(workspaceRoot, log, pathToJest);
  }

  protected configFilter = ([, projectConfig]: [string, NxAngular]) =>
    projectConfig.architect &&
    projectConfig.architect.test &&
    projectConfig.architect.test.builder === "@nrwl/jest:jest";

  protected configMap = ([projectName, projectConfig]: [string, NxAngular]) => {
    const options = projectConfig.architect.test.options;

    return {
      ...this.getJestExecutionParameters(projectName),
      jestConfig: path.resolve(this.workspaceRoot, options.jestConfig),
      projectName,
      rootPath: path.resolve(this.workspaceRoot, path.dirname(options.jestConfig)),
      setupFile: options.setupFile && path.resolve(this.workspaceRoot, options.setupFile),
      tsConfig: path.resolve(this.workspaceRoot, options.tsConfig),
    };
  };
}

export { NxdevAngular };
