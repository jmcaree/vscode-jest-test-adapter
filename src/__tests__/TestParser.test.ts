import { JestSettings } from "jest-editor-support";
import { createMatcher } from "../TestParser";

// we need to check whether we are running on Windows for file matching.
const isWindows = process.platform === "win32";

const getTestMatchData = (): Array<[string, string, boolean]> => {
  if (isWindows) {
    return [
      // check that upper and lowercase drive letters match correctly for each platform.
      ["c:\\testfile.test.js", "c:/**/*.test.js", true],
      ["C:\\testfile.test.js", "c:/**/*.test.js", isWindows],
      ["c:\\testfile.test.js", "C:/**/*.test.js", isWindows],
      ["C:\\testfile.test.js", "C:/**/*.test.js", true],
    ];
  }
  return [["/folder/app.test.js", "**/*.test.js", true]];
};

const getTestRegexData = (): Array<[string, string, boolean]> => {
  if (isWindows) {
    return [
      // check that upper and lowercase drive letters match correctly for each platform.
      ["c:\\testfile.test.js", "c:\\\\.*\\.test\\.[tj]sx?", true],
      ["C:\\testfile.test.js", "c:\\\\.*\\.test\\.[tj]sx?", isWindows],
      ["c:\\testfile.test.js", "C:\\\\.*\\.test\\.[tj]sx?", isWindows],
      ["C:\\testfile.test.js", "C:\\\\.*\\.test\\.[tj]sx?", true],
    ];
  }
  return [["/folder/app.test.js", ".*/.*\\.test\\.[tj]sx?", true]];
};

describe("Matcher tests", () => {
  test.each(getTestMatchData())(
    "Given a file glob pattern and filepath when invoked then the Matcher function correctly matches the filepath",
    (filePath, glob, expectedToMatch) => {
      const matcher = createMatcher(createConfig({ testMatch: [glob] }));
      expect(matcher(filePath)).toBe(expectedToMatch);
    },
  );

  test.each(getTestRegexData())(
    "Given a regex pattern and filepath when invoked then the Matcher function correctly matches the filepath",
    (filePath, regex, expectedToMatch) => {
      const matcher = createMatcher(createConfig({ testRegex: [regex] }));
      expect(matcher(filePath)).toBe(expectedToMatch);
    },
  );

  test.each`
    ignorePattern                         | filePath                          | expectedResult
    ${"test"}                             | ${"c:\\folder\\testfile.test.js"} | ${false}
    ${"file"}                             | ${"c:\\folder\\testfile.test.js"} | ${false}
    ${"folder"}                           | ${"c:\\folder\\testfile.test.js"} | ${false}
    ${"c:\\\\"}                           | ${"c:\\folder\\testfile.test.js"} | ${false}
    ${"c:\\\\folder\\\\testfile.test.js"} | ${"c:\\folder\\testfile.test.js"} | ${false}
    ${"c:\\\\folder"}                     | ${"c:\\folder\\testfile.test.js"} | ${false}
    ${"c:\\\\another_folder"}             | ${"c:\\folder\\testfile.test.js"} | ${true}
    ${"another_string"}                   | ${"c:\\folder\\testfile.test.js"} | ${true}
  `(
    `Given an ignore pattern of '$ignorePattern' and a file path of '$filePath'
     When the matcher is invoked
     Then the result is $expectedResult`,
    ({
      ignorePattern,
      filePath,
      expectedResult,
    }: {
      ignorePattern: string;
      filePath: string;
      expectedResult: boolean;
    }) => {
      const config = createConfig({ testRegex: [".*.js$"] });
      config.configs[0].rootDir = "c:\\";

      // run the matcher before to confirm that it works without the ignore pattern.
      let matcher = createMatcher(config);
      expect(matcher(filePath)).toBe(true);

      // now include the ignore pattern.
      config.configs[0].testPathIgnorePatterns = [ignorePattern];
      matcher = createMatcher(config);
      expect(matcher(filePath)).toBe(expectedResult);
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
