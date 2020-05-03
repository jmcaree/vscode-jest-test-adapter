import fs from "fs";
import path from "path";
import util from "util";
import { Log } from "vscode-test-adapter-util";
import RepoParserBase from "./RepoParserBase";
import { ProjectConfig, RepoParser } from "./types";

// the following requires Node 8 minimum.
export const exists = util.promisify(fs.exists);
export const readFile = util.promisify(fs.readFile);

abstract class NxdevBase<T> extends RepoParserBase implements RepoParser {
  public abstract type: string;

  protected abstract configFileName: string;

  protected abstract configFilter: (entry: [string, T]) => boolean;

  protected abstract configMap: (entry: [string, T]) => ProjectConfig;

  constructor(workspaceRoot: string, log: Log, pathToJest: string) {
    super(workspaceRoot, log, pathToJest);
  }

  public async getProjects(): Promise<ProjectConfig[]> {
    const buffer = await readFile(path.resolve(this.workspaceRoot, this.configFileName));
    const angularConfig = JSON.parse(buffer.toString()) as { projects: { key: T } };
    const angularProjects = Object.entries<T>(angularConfig.projects)
      .filter(this.configFilter)
      .map(entry => this.configMap(entry));

    return angularProjects;
  }

  public async isMatch() {
    return (
      (await exists(path.resolve(this.workspaceRoot, this.configFileName))) &&
      (await exists(path.resolve(this.workspaceRoot, "nx.json")))
    );
  }
}

export { NxdevBase };
