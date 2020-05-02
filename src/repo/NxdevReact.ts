import path from "path";
import { Log } from 'vscode-test-adapter-util';
import { exists, readFile } from "./NxdevAngular";
import RepoParserBase from "./RepoParserBase";
import { ProjectConfig, RepoParser } from "./types";

// TODO this is probably completely different.
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

class NxdevReact extends RepoParserBase implements RepoParser {
  public type = "Nx.dev React";

  constructor(workspaceRoot: string, log: Log, pathToJest: string) {
    super(workspaceRoot, log, pathToJest);
  }

  public async getProjects(): Promise<ProjectConfig[]> {
    const buffer = await readFile(path.resolve(this.workspaceRoot, "workspace.json"));
    const reactConfig = JSON.parse(buffer.toString());

    const reactProjects = Object.entries<NxReact>(reactConfig.projects)
      .filter(
        ([, projectConfig]) =>
          projectConfig.architect &&
          projectConfig.architect.test &&
          projectConfig.architect.test.builder &&
          projectConfig.architect.test.builder === "@nrwl/jest:jest",
      )
      .map(([projectName, projectConfig]) => {
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
      });

    return reactProjects;
  }

  public async isMatch() {
    return (
      (await exists(path.resolve(this.workspaceRoot, "workspace.json"))) &&
      (await exists(path.resolve(this.workspaceRoot, "nx.json")))
    );
  }
}

export { NxdevReact };
