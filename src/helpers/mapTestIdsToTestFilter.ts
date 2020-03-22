import _ from 'lodash';
import { ITestFilter } from "../types";
import escapeRegExp from "./escapeRegExp";
import { mapStringToId } from "./idMaps";

export function mapTestIdsToTestFilter(tests: string[]): ITestFilter | null {
  if (tests.length === 0 || tests.some(t => t === "root")) {
    return null;
  }

  const ids = tests.map(t => mapStringToId(t));

  // if there are any ids that do not contain a fileName, then we should run all the tests in the project.
  if (_.some(ids, x => !x.fileName)) {
    return null;
  }

  // we accumulate the file and test names into regex expressions.  Note we escape the names to avoid interpreting
  // any regex control characters in the file or test names.
  const testNamePattern = ids.filter(x => x.testId).map(z => escapeRegExp(z.testId || "")).join("|");
  const testFileNamePattern = ids.filter(x => x.fileName).map(z => escapeRegExp(z.fileName || "")).join("|");

  return {
    testFileNamePattern,
    testNamePattern,
  };
}
