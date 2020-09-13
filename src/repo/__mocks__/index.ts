// tslint:disable: variable-name

import { ProjectConfig, RepoParser } from "../types";

let projects: ProjectConfig[] = [];

const __setProjects = (p: ProjectConfig[]) => {
  projects = p;
};

const mockRepoParser: RepoParser = {
  getProjects: jest.fn(async () => projects),
  isMatch: jest.fn().mockResolvedValue(true),
  projectChange: jest.fn(() => ({
    dispose: jest.fn(() => {})
  })),
  type: "mocked repo parser",
};

const getRepoParser = jest.fn().mockImplementation(() => mockRepoParser);

export { getRepoParser, __setProjects };
