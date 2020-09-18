import { JestSettings } from "jest-editor-support";
import _ from "lodash";
import { getSettings } from "../index";

let mockSettings: JestSettings;

jest.mock("jest-editor-support", () => ({
  getSettings: () => mockSettings,
}));

describe("getSettings tests", () => {
  it(`Given a Jest config with a string for testRegex
      when getSettings is called
      then testRegex returns a string array with a single value`, async () => {
    mockSettings = createConfigWithTestRegex("some regex");
    // @ts-ignore
    const workspace: ProjectWorkspace = {};

    const settings = await getSettings(workspace);

    expect(settings.configs[0].testRegex).toStrictEqual(["some regex"]);
    compareConfigsExcludingTestRegex(settings, mockSettings);
  });

  it(`Given a Jest config with a string array for testRegex
      when getSettings is called
      then testRegex returns a string array with a single value`, async () => {
    mockSettings = createConfigWithTestRegex(["some regex", "another regex"]);
    // @ts-ignore
    const workspace: ProjectWorkspace = {};

    const settings = await getSettings(workspace);

    expect(settings.configs[0].testRegex).toStrictEqual(["some regex", "another regex"]);
    expect(settings).toStrictEqual(mockSettings);
  });
});

const compareConfigsExcludingTestRegex = (actual: JestSettings, expected: JestSettings) => {
  const actualEntries = Object.entries(actual.configs[0]).filter(([key]) => key !== "testRegex");
  const expectedEntries = Object.entries(expected.configs[0]).filter(([key]) => key !== "testRegex");

  expect(actualEntries).toHaveLength(expectedEntries.length);

  for (let i = 0; i < actualEntries.length; i++) {
    const a = actualEntries[i];
    const b = expectedEntries[i];

    expect(a[0]).toBe(b[0]);
    expect(a[1]).toStrictEqual(b[1]);
  }
};

const createConfigWithTestRegex = (testRegex: string[] | string): JestSettings => {
  return {
    configs: [
      // @ts-ignore
      {
        automock: true,
        browser: false,
        cwd: "somewhere",
        name: "test project",
        // @ts-ignore
        testRegex,
      },
    ],
    jestVersionMajor: 20,
  };
};
