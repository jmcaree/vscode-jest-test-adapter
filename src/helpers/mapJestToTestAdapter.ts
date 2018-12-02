
import {
  JestAssertionResults,
  JestFileResults,
  JestTotalResults,
} from "jest-editor-support";
import {
  TestInfo,
  TestSuiteInfo,
} from "vscode-test-adapter-api";
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
        const id = `^${escapeRegExp(fullName)}`;
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
    id: mapJestAssertionToId(result),
    label: result.title,
    type: "test",
  };
}

export function mapJestAssertionToId(result: JestAssertionResults): string {
  const fullName = (result.ancestorTitles || []).concat([result.title]).join(" ");
  return `^${escapeRegExp(fullName)}$`;
}
