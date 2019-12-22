import { JestAssertionResults } from "jest-editor-support";
import { DESCRIBE_ID_SEPARATOR, TEST_ID_SEPARATOR } from "../constants";

export function mapAssertionResultToTestId(assertionResult: JestAssertionResults, fileName: string) {
  // we seem to get an issue with the casing of the drive letter in Windows at least.  We are going to lowercase
  // the letter.
  const driveLetterRegex = /^([a-zA-Z])\:\\/;
  if (driveLetterRegex.test(fileName)) {
    fileName = fileName.replace(driveLetterRegex, x => x.toLowerCase());
  }

  // TODO we may be able to rationalise the code that generates ids here.
  const describeBlocks = assertionResult.ancestorTitles && assertionResult.ancestorTitles.length > 0
    ? DESCRIBE_ID_SEPARATOR + assertionResult.ancestorTitles.join(DESCRIBE_ID_SEPARATOR)
    : "";
  return `${fileName}${describeBlocks}${TEST_ID_SEPARATOR}${assertionResult.title}`;
}
