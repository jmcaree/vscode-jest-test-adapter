import {
  JestAssertionResults,
  JestFileResults,
  JestTotalResults,
} from "jest-editor-support";
import {
  TestInfo,
  TestSuiteInfo,
} from "vscode-test-adapter-api";
import { TEST_ID_SEPARATOR } from "../constants";
import { ITestFilter } from "../types";
import escapeRegExp from "./escapeRegExp";

export function mapJestTotalResultToTestSuiteInfo(result: JestTotalResults, workDir: string): TestSuiteInfo {
  return {
    children: result.testResults.map((t) => mapJestFileResultToTestSuiteInfo(t, workDir)),
    id: "root",
    label: "Jest",
    type: "suite",
  };
}

export function mapJestFileResultToTestSuiteInfo(result: JestFileResults, workDir: string): TestSuiteInfo {
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

export function mapJestAssertionToTestInfo(result: JestAssertionResults, file: string): TestInfo {
  return {
    file,
    id: `${escapeRegExp(file)}${TEST_ID_SEPARATOR}${mapJestAssertionToId(result)}`,
    label: result.title,
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
      testFileNamePattern: `"(${tests.map((t) => t.split(TEST_ID_SEPARATOR)[0]).join("|")})"`,
      testNamePattern: `"(${tests.map((t) => t.split(TEST_ID_SEPARATOR)[1]).join("|")})"`,
    };
  } else {
    // Test filter is a file path
    return {
      testFileNamePattern: `"(${tests.join("|")})"`,
    };
  }
}
