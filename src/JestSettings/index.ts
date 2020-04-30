import {
  getSettings as editorSupportGetSettings,
  JestSettings,
  Options,
  ProjectWorkspace,
  Runner,
} from "jest-editor-support";
import path from "path";

const getSettings = (projectWorkspace: ProjectWorkspace): Promise<JestSettings> => {
  return editorSupportGetSettings(convertWorkspace(projectWorkspace));
};

const createRunner = (projectWorkspace: ProjectWorkspace, options: Options) => {
  return new Runner(convertWorkspace(projectWorkspace), options);
};

const convertWorkspace = (projectWorkspace: ProjectWorkspace): ProjectWorkspace => {
  const { base: jestCommand, dir } = path.parse(projectWorkspace.pathToJest);

  // quote the pathToConfig in case there are spaces in the path.
  // set the pathToJest to the Jest executable name and set the root path to the Jest executable folder.
  // jest-editor-support will use the root path for the cwd and pathToJest as the command of the process to get Jest
  // settings.  This overcomes issues with whitespace in the path of the command too.
  // the --projects command is kind of a workaround for setting the cwd to a directory other than the root of the current
  // project.
  return {
    ...projectWorkspace,
    pathToConfig: `"${projectWorkspace.pathToConfig}"`,
    pathToJest: `${jestCommand} --projects "${projectWorkspace.pathToConfig}"`,
    rootPath: dir,
  };
};

export { createRunner, getSettings };
