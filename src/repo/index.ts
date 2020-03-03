import { NxdevAngular } from "./NxdevAngular";
import { NxdevReact } from "./NxdevReact";
import { StandardParser } from "./StandardParser";
import { ProjectConfig, RepoParser } from "./types";

const repoParsers: RepoParser[] = [new NxdevAngular(), new NxdevReact(), new StandardParser()];

const getRepoParser = () => repoParsers.filter(async x => (await x.isMatch()) === true)[0];

export { ProjectConfig, RepoParser, getRepoParser };
