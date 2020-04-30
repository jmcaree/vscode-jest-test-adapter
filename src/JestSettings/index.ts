import { getSettings as editorSupportGetSettings, JestSettings, ProjectWorkspace } from "jest-editor-support";
import path from "path";

const getSettings = (projectWorkspace: ProjectWorkspace): Promise<JestSettings> => {
  const { base: jestCommand, dir } = path.parse(projectWorkspace.pathToJest);

  // quote the pathToConfig in case there are spaces in the path.
  // set the pathToJest to the Jest executable name and set the root path to the Jest executable folder.  
  // jest-editor-support will use the root path for the cwd and pathToJest as the command of the process to get Jest
  // settings.  This overcomes issues with whitespace in the path of the command too.
  return editorSupportGetSettings({
    ...projectWorkspace,
    pathToConfig: `"${projectWorkspace.pathToConfig}"`,
    pathToJest: jestCommand,
    rootPath: dir,
  });
};

export { getSettings };
