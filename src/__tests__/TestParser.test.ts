import { JestSettings } from "jest-editor-support";
import { createMatcher } from "../TestParser";

// we need to check whether we are running on Windows for file matching.
const isWindows = process.platform === "win32";

const testMatchData:Array<[string, string, boolean]> = [
  // check that upper and lowercase drive letters match correctly for each platform.
  ["c:\\testfile.test.js", "c:/**/*.test.js", isWindows],
  ["C:\\testfile.test.js", "c:/**/*.test.js", true],
  ["c:\\testfile.test.js", "C:/**/*.test.js", true],
  ["C:\\testfile.test.js", "C:/**/*.test.js", isWindows],
];

const testRegexData:Array<[string, string, boolean]> = [
  // check that upper and lowercase drive letters match correctly for each platform.
  ["c:\\testfile.test.js", ".*\\.test\\.[tj]sx?", true],
  ["C:\\testfile.test.js", ".*\\.test\\.[tj]sx?", true],
];

describe("Matcher tests", () => {
  test.each(testMatchData)(
    "Given a file glob pattern and filepath when invoked then the Matcher function correctly matches the filepath",
    (filePath, glob, expectedToMatch) => {
      const matcher = createMatcher(createConfig({ testMatch: [glob] }));
      expect(matcher(filePath)).toBe(expectedToMatch);
    },
  );

  test.each(testRegexData)(
    "Given a regex pattern and filepath when invoked then the Matcher function correctly matches the filepath",
    (filePath, regex, expectedToMatch) => {
      const matcher = createMatcher(createConfig({ testRegex: [regex] }));
      expect(matcher(filePath)).toBe(expectedToMatch);
    },
  );
});

const createConfig = ({ testRegex, testMatch }: { testRegex?: string[]; testMatch?: string[] }): JestSettings => {
  if (!testRegex && !testMatch && !(testRegex && testMatch)) {
    throw new Error("please specify one of testMatch or testRegex not both");
  }

  // we're just implementing the properties that are required by TestParser.
  return {
    configs: [
      {
        testMatch,
        testRegex,
      },
    ],
    jestVersionMajor: 20,
  } as JestSettings;
};
