import { NxdevAngular } from "./NxdevAngular";
import { NxdevReact } from "./NxdevReact";
import { StandardParser } from "./StandardParser";
import { ProjectConfig, RepoParser } from "./types";

const getRepoParser = (workspaceRoot: string) => {
  const repoParsers: RepoParser[] = [new NxdevAngular(workspaceRoot), new NxdevReact(workspaceRoot), new StandardParser(workspaceRoot)];
  return repoParsers.filter(async (x) => (await x.isMatch()) === true)[0];
};

export { ProjectConfig, RepoParser, getRepoParser };
