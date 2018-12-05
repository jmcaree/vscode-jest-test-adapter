import { JestTotalResults, TestReconciler } from "jest-editor-support";

export interface IJestResponse {
  results: JestTotalResults;
  reconciler: TestReconciler;
}

export interface ITestFilter {
  testFileNamePattern?: string;
  testNamePattern?: string;
}
