import { JestTotalResults, TestReconciler } from "jest-editor-support";
import * as vscode from 'vscode';
import { RootNode } from './helpers/tree';

export interface IJestResponse {
  results: JestTotalResults;
  reconciler: TestReconciler;
}

export interface ITestFilter {
  testFileNamePattern?: string;
  testNamePattern?: string;
}

export type Matcher = (value: string) => boolean;
export type FileType = "App" | "Test" | "Config" | "Other";
export type EnvironmentChangedEvent = TestsChangedEvent | ApplicationChangedEvent;

export interface TestState {
  testFiles: string[];
  suite: RootNode;
}

export interface TestsChangedEvent {
  type: "Test"
  testFiles: string[];
  addedTestFiles: string[];
  modifiedTestFiles: string[];
  removedTestFiles: string[];
  updatedSuite: RootNode;
  invalidatedTestIds: string[]
}

export interface ApplicationChangedEvent {
  type: "App";
  invalidatedTestIds: ["root"]
}

export interface IDisposable {
  dispose(): void;
}

export const cancellationTokenNone: vscode.CancellationToken = new vscode.CancellationTokenSource().token
