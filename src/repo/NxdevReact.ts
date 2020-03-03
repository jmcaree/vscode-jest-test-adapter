import path from "path";
import { exists, readFile } from "./NxdevAngular";
import RepoParserBase from "./RepoParserBase";
import { RepoParser } from "./types";

// TODO this is probably completely different.
interface NxReact {
  architect: {
    test: {
      builder: string;
      options: {
        jestConfig: string;
        tsConfig: string;
        setupFile: string;
      };
    };
  };
}

export class NxdevReact extends RepoParserBase implements RepoParser {
  public type = "Nx.dev React";

  public async getProjects() {
    const buffer = await readFile(".\\workspace.json");
    const reactConfig = JSON.parse(buffer.toString());

    // TODO this is probably completely different.
    const reactProjects = Object.entries<NxReact>(reactConfig.projects)
      .filter(
        ([, projectConfig]) =>
          projectConfig.architect &&
          projectConfig.architect.test &&
          projectConfig.architect.test.builder &&
          projectConfig.architect.test.builder === "@nrwl/jest:jest",
      )
      .map(([projectName, projectConfig]) => ({
        projectName,
        ...projectConfig.architect.test.options,
        // TODO this is assuming that the project root is where the jest config is.
        rootPath: path.dirname(projectConfig.architect.test.options.jestConfig),
      }));

    return reactProjects;
  }

  public async isMatch() {
    return (await exists(".\\workspace.json")) && (await exists(".\\nx.json"));
  }
}
