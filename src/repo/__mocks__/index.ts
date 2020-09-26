// tslint:disable: variable-name

import * as vscode from "vscode";
import { ProjectChangeEvent, ProjectConfig, RepoParser } from "../types";

let projects: ProjectConfig[] = [];

const __setProjects = (p: ProjectConfig[]) => {
  projects = p;
};

const eventEmitter = new vscode.EventEmitter<ProjectChangeEvent>();

const mockRepoParser: RepoParser = {
  getProjects: jest.fn(async () => projects),
  isMatch: jest.fn().mockResolvedValue(true),
  projectChange: eventEmitter.event,
  type: "mocked repo parser",
};

const getRepoParser = jest.fn().mockImplementation(() => mockRepoParser);

const __addProject = (p: ProjectConfig) => {
  __setProjects([...projects, p]);

  eventEmitter.fire({
    config: p,
    type: "added",
  });
};

const __removeProject = (projectPath: string) => {
  __setProjects(projects.filter(p => p.rootPath !== projectPath));

  eventEmitter.fire({
    rootPath: projectPath,
    type: "removed",
  });
}

export { getRepoParser, __addProject, __removeProject, __setProjects };
