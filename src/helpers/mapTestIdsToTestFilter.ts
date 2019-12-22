import { DESCRIBE_ID_SEPARATOR, TEST_ID_SEPARATOR } from "../constants";
import { ITestFilter } from "../types";
import escapeRegExp from "./escapeRegExp";

export function mapTestIdsToTestFilter(tests: string[]): ITestFilter | null {
  if (tests[0] && tests[0] === "root") {
    return null;
  }

  const results = tests
    .map(t => t.split(RegExp(`${TEST_ID_SEPARATOR}|${DESCRIBE_ID_SEPARATOR}`)))
    .reduce((acc, [f, ...rest]) => {
      // add the file if it is not already in the list of files.
      if (!acc.fileNames.includes(f)) {
        acc.fileNames.push(f);
      }
      // add the tests to the tests if not already present.
      if (rest && rest.length > 0) {
        const testName = rest[rest.length - 1];
        if (!acc.testNames.includes(testName)) {
          acc.testNames.push(testName);
        }
      }
      return acc;
    }, {
      fileNames: [] as string[],
      testNames: [] as string[],
    });
    
  // we accumulate the file and test names into regex expressions.  Note we escape the names to avoid interpreting
  // any regex control characters in the file or test names.
  return {
    testFileNamePattern: `(${results.fileNames.map(escapeRegExp).join("|")})`,
    testNamePattern: results.testNames.length > 0 ? `(${results.testNames.map(escapeRegExp).join("|")})` : undefined,
  };
}
