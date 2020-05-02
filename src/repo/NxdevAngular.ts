import fs from "fs";
import path from "path";
import util from "util";
import { Log } from 'vscode-test-adapter-util';
import RepoParserBase from "./RepoParserBase";
import { ProjectConfig, RepoParser } from "./types";

// the following requires Node 8 minimum.
export const exists = util.promisify(fs.exists);
export const readFile = util.promisify(fs.readFile);

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

class NxdevAngular extends RepoParserBase implements RepoParser {
  public type = "Nx.dev Angular";

  constructor(workspaceRoot: string, log: Log, pathToJest: string) {
    super(workspaceRoot, log, pathToJest);
  }

  public async getProjects(): Promise<ProjectConfig[]> {
    // if we parse the angular.json file we get all the config we need.
    // Note that we filter out projects that do not have a jest builder.
    const buffer = await readFile(path.resolve(this.workspaceRoot, "angular.json"));
    const angularConfig = JSON.parse(buffer.toString());
    const angularProjects = Object.entries<NxAngular>(angularConfig.projects)
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

    return angularProjects;
  }

  public async isMatch() {
    return (
      (await exists(path.resolve(this.workspaceRoot, "angular.json"))) &&
      (await exists(path.resolve(this.workspaceRoot, "nx.json")))
    );
  }
}

export { NxdevAngular };
