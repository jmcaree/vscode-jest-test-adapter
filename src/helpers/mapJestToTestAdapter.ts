import {
  JestAssertionResults,
  JestFileResults,
  JestTotalResults,
  TestAssertionStatus,
  TestReconciler,
} from "jest-editor-support";
import {
  TestDecoration,
  TestInfo,
  TestSuiteInfo,
} from "vscode-test-adapter-api";
import { TEST_ID_SEPARATOR } from "../constants";
import { IJestResponse, ITestFilter } from "../types";
import escapeRegExp from "./escapeRegExp";

function getAssertionStatus(
  result: JestAssertionResults,
  file: string,
  reconciler?: TestReconciler,
): TestAssertionStatus | undefined {
  if (reconciler) {
    const fileResult = reconciler.assertionsForTestFile(file) || [];
    return fileResult.find((x) => x.title === result.fullName);
  }
  return undefined;
}

export function mapJestResponseToTestSuiteInfo(
  { results, reconciler }: IJestResponse,
  workDir: string,
): TestSuiteInfo {
  return {
    children: results.testResults.map((t) => mapJestFileResultToTestSuiteInfo(t, workDir, reconciler)),
    id: "root",
    label: "Jest",
    type: "suite",
  };
}

export function mapJestTotalResultToTestSuiteInfo(result: JestTotalResults, workDir: string): TestSuiteInfo {
  return {
    children: result.testResults.map((t) => mapJestFileResultToTestSuiteInfo(t, workDir)),
    id: "root",
    label: "Jest",
    type: "suite",
  };
}

export function mapJestFileResultToTestSuiteInfo(
  result: JestFileResults,
  workDir: string,
  reconciler?: TestReconciler,
): TestSuiteInfo {
  const testSuites = result.assertionResults
    .filter((testResult) => testResult.ancestorTitles && testResult.ancestorTitles.length > 0)
    .reduce((testTree, testResult) => {
      const target = (testResult.ancestorTitles as string[]).reduce((innerTree, ancestorTitle, i, a) => {
        const fullName = a.slice(0, i + 1).join(" ");
        const id = `${escapeRegExp(result.name)}${TEST_ID_SEPARATOR}^${escapeRegExp(fullName)}`;
        let next = innerTree.find((x) => x.id === id);
        if (next) {
          return (next as TestSuiteInfo).children;
        } else {
          next = {
            children: [],
            file: result.name,
            id,
            label: ancestorTitle,
            type: "suite",
          };
          innerTree.push(next);
          return next.children;
        }
      }, testTree);

      target.push(mapJestAssertionToTestInfo(testResult, result.name));

      return testTree;
    }, new Array<TestSuiteInfo | TestInfo>());

  const testCases: Array<TestSuiteInfo | TestInfo> = result.assertionResults
    .filter((testResult) => !testResult.ancestorTitles || testResult.ancestorTitles.length === 0)
    .map((testResult) => mapJestAssertionToTestInfo(testResult, result.name));

  return {
    children: testCases.concat(testSuites),
    file: result.name,
    id: escapeRegExp(result.name),
    label: result.name.replace(new RegExp(escapeRegExp(workDir), "ig"), ""),
    type: "suite",
  };
}

export function mapJestAssertionToTestDecorations(
  result: JestAssertionResults,
  file: string,
  reconciler?: TestReconciler,
): TestDecoration[] {
  const assertionResult = getAssertionStatus(result, file, reconciler);
  if (assertionResult) {
    return [{
      line: assertionResult.line || 0,
      message: assertionResult.terseMessage || "",
    }];
  }
  return [];
}

export function mapJestAssertionToTestInfo(
  result: JestAssertionResults,
  file: string,
  reconciler?: TestReconciler,
): TestInfo {
  const assertionResult = getAssertionStatus(result, file, reconciler);
  let line: number | undefined;
  let skipped: boolean = false;
  if (assertionResult) {
    line = assertionResult.line;
    skipped = assertionResult.status === "KnownSkip";
  }

  return {
    file,
    id: `${escapeRegExp(file)}${TEST_ID_SEPARATOR}${mapJestAssertionToId(result)}`,
    label: result.title,
    line,
    skipped,
    type: "test",
  };
}

export function mapJestAssertionToId(result: JestAssertionResults): string {
  return `^${escapeRegExp(result.fullName)}$`;
}

export function mapTestIdsToTestFilter(tests: string[]): ITestFilter | null {
  if (tests[0] && tests[0] === "root") {
    return null;
  }

  // Test matching is done by creating a regular expression out of the specified test IDs
  if (tests[0].includes(TEST_ID_SEPARATOR)) {
    // Test filter is a name
    return {
      testFileNamePattern: `(${tests.map((t) => t.split(TEST_ID_SEPARATOR)[0]).join("|")})`,
      testNamePattern: `(${tests.map((t) => t.split(TEST_ID_SEPARATOR)[1]).join("|")})`,
    };
  } else {
    // Test filter is a file path
    return {
      testFileNamePattern: `(${tests.join("|")})`,
    };
  }
}
