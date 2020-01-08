import { JestAssertionResults } from "jest-editor-support";
import { DESCRIBE_ID_SEPARATOR, TEST_ID_SEPARATOR } from "../constants";

export function mapAssertionResultToTestId(assertionResult: JestAssertionResults, fileName: string) {
  fileName = lowerCaseDriveLetter(fileName)

  // TODO we may be able to rationalise the code that generates ids here.
  const describeBlocks = assertionResult.ancestorTitles && assertionResult.ancestorTitles.length > 0
    ? DESCRIBE_ID_SEPARATOR + assertionResult.ancestorTitles.join(DESCRIBE_ID_SEPARATOR)
    : "";
  return `${fileName}${describeBlocks}${TEST_ID_SEPARATOR}${assertionResult.title}`;
}

/**
 * A function that lowercases the drive letter for the given path.  In Windows at least, we seem to get an issue with
 * the casing of the drive letter.  This method consistently makes the case lower.
 * @param path the file path to lowercase the drive letter for.
 */
export const lowerCaseDriveLetter = (path: string): string => {
  const driveLetterRegex = /^([a-zA-Z])\:\\/;
  if (driveLetterRegex.test(path)) {
    return path.replace(driveLetterRegex, x => x.toLowerCase());
  }
  return path;
}
