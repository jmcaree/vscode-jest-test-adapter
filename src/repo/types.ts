import vscode from "vscode";

export interface ProjectConfig {
  jestConfig?: string;
  tsConfig?: string;
  setupFile?: string;
  projectName: string;

  // TODO we should retrieve this from the jestConfig.
  rootPath: string;
}

export type ProjectChangeEvent =
  | {
      type: "added";
      config: ProjectConfig;
    }
  | {
      type: "removed";
      rootPath: string;
    };

export interface RepoParser {
  type: string;
  isMatch: () => Promise<boolean>;
  getProjects: () => Promise<ProjectConfig[]>;
  readonly projectChange: vscode.Event<ProjectChangeEvent>;
}
