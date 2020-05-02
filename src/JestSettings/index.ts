import {
  getSettings as editorSupportGetSettings,
  JestSettings,
  Options,
  ProjectWorkspace,
  Runner,
} from "jest-editor-support";
import path from "path";
import { ProjectConfig } from "../repo";

const getSettings = (projectConfig: ProjectConfig): Promise<JestSettings> => {
  return editorSupportGetSettings(convertToWorkspace(projectConfig));
};

const createRunner = (projectConfig: ProjectConfig, options: Options) => {
  return new Runner(convertToWorkspace(projectConfig), options);
};

const convertToWorkspace = (projectConfig: ProjectConfig): ProjectWorkspace => {
  let rootPath: string;
  let jestCommand: string;
  let pathToConfig: string;

  if (projectConfig.pathToJest === "jest") {
    // globally installed jest.
    jestCommand = "jest";
    rootPath = projectConfig.rootPath;
  } else {
    // jest is locally installed.
    const { base, dir } = path.parse(projectConfig.pathToJest);
    jestCommand = base;
    rootPath = dir;
  }

  if (projectConfig.jestConfig) {
    // jest config file exists.
    // quote the config file in case there is space chars.
    pathToConfig = `"${projectConfig.jestConfig}"`;
    // the `--projects` command is kind of a workaround for setting the cwd to a directory other than the project root.
    jestCommand = `${jestCommand} --projects "${projectConfig.jestConfig}"`;
  } else {
    // no jest config file.
    // we don't add a `--projects` option since we are defaulting to the project root dir as the execution folder.

    // set pathToConfig to undefined.  This is a type error that should be fixed in jest-editor-support.
    pathToConfig = (undefined as unknown) as string;
  }

  // set the pathToJest to the Jest executable name and set the root path to the Jest executable folder.
  // jest-editor-support will use the root path for the cwd and pathToJest as the command of the process to get Jest
  // settings.  This overcomes issues with whitespace in the path of the command too.
  return {
    localJestMajorVersion: 20, // TODO we could actually get this from the command line if we wanted.
    pathToConfig,
    pathToJest: jestCommand,
    rootPath,
  };
};

export { createRunner, getSettings };
