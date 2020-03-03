import fs from "fs";
import path from "path";
import util from "util";
import RepoParserBase from "./RepoParserBase";
import { RepoParser } from "./types";

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
        setupFile: string;
      };
    };
  };
}

class NxdevAngular extends RepoParserBase implements RepoParser {
  public type = "Nx.dev Angular";

  public async getProjects() {
    // if we parse the angular.json file we get all the config we need.
    // Note that we filter out projects that do not have a jest builder.
    const buffer = await readFile(".\\angular.json");
    const angularConfig = JSON.parse(buffer.toString());
    const angularProjects = Object.entries<NxAngular>(angularConfig.projects)
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

    return angularProjects;
  }

  public async isMatch() {
    return (await exists(".\\angular.json")) && (await exists(".\\nx.json"));
  }
}

export { NxdevAngular };
