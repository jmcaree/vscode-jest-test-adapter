import { Log } from 'vscode-test-adapter-util';
import { NxdevAngular } from "./NxdevAngular";
import { NxdevReact } from "./NxdevReact";
import { StandardParser } from "./StandardParser";
import { ProjectConfig, RepoParser } from "./types";

const getRepoParser = async (workspaceRoot: string, log: Log) => {
  const repoParsers: RepoParser[] = [
    new NxdevAngular(workspaceRoot, log),
    new NxdevReact(workspaceRoot, log),
    new StandardParser(workspaceRoot, log),
  ];

  const matchingParsers = await Promise.all(
    repoParsers.map(async p => ({ parser: p, match: await p.isMatch() })),
  ).then(x => x.filter(z => z.match).map(z => z.parser));

  return matchingParsers[0];
};

export { ProjectConfig, RepoParser, getRepoParser };
