import { NxdevAngular } from "./NxdevAngular";
import { NxdevReact } from "./NxdevReact";
import { StandardParser } from "./StandardParser";
import { ProjectConfig, RepoParser } from "./types";

const getRepoParser = async (workspaceRoot: string) => {
  const repoParsers: RepoParser[] = [
    new NxdevAngular(workspaceRoot),
    new NxdevReact(workspaceRoot),
    new StandardParser(workspaceRoot),
  ];

  const matchingParsers = await Promise.all(
    repoParsers.map(async p => ({ parser: p, match: await p.isMatch() })),
  ).then(x => x.filter(z => z.match).map(z => z.parser));

  return matchingParsers[0];
};

export { ProjectConfig, RepoParser, getRepoParser };
