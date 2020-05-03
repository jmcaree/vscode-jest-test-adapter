import path from "path";
import { Log } from "vscode-test-adapter-util";
import { NxdevBase } from "./NxdevBase";
import { RepoParser } from "./types";

interface NxReact {
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

class NxdevReact extends NxdevBase<NxReact> implements RepoParser {
  public type = "Nx.dev React";

  protected configFileName = "workspace.json";

  constructor(workspaceRoot: string, log: Log, pathToJest: string) {
    super(workspaceRoot, log, pathToJest);
  }

  protected configFilter = ([, projectConfig]: [string, NxReact]) =>
    projectConfig.architect &&
    projectConfig.architect.test &&
    projectConfig.architect.test.builder === "@nrwl/jest:jest";

  protected configMap = ([projectName, projectConfig]: [string, NxReact]) => {
    const options = projectConfig.architect.test.options;

    const { jestCommand, jestExecutionDirectory } = this.getJestCommandAndDirectory();

    return {
      jestCommand,
      jestConfig: path.resolve(this.workspaceRoot, options.jestConfig),
      jestExecutionDirectory,
      projectName,
      // TODO this is assuming that the project root is where the jest config is.
      rootPath: path.resolve(this.workspaceRoot, path.dirname(options.jestConfig)),
      setupFile: options.setupFile && path.resolve(this.workspaceRoot, options.setupFile),
      tsConfig: path.resolve(this.workspaceRoot, options.tsConfig),
    };
  };
}

export { NxdevReact };
