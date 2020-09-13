import {
  JestSettings,
  // Options,
  // Runner,
} from "jest-editor-support";
import { ProjectConfig } from "../../repo";

const settingsMock = jest.fn(
  async (projectConfig: ProjectConfig): Promise<JestSettings> => ({
    configs: [],
    jestVersionMajor: 20,
  }),
);

const getSettings = settingsMock;

// const createRunner = (projectConfig: ProjectConfig, options: Options): Runner => {

// };

export { /*createRunner,*/ getSettings };
