import vscode from "vscode";

export interface ProjectConfig {
  jestConfig?: string;
  jestCommand: string;
  jestExecutionDirectory: string;
  projectName: string;
  rootPath: string;
  setupFile?: string;
  tsConfig?: string;
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
