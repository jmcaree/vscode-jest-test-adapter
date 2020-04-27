import { IParseResults, JestTotalResults, TestReconciler } from "jest-editor-support";
import * as vscode from "vscode";
import { ProjectRootNode, WorkspaceRootNode } from "./helpers/tree";

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
export type EnvironmentChangedEvent = ProjectTestsChangedEvent | ApplicationChangedEvent;

export interface WorkspaceTestState {
  suite: WorkspaceRootNode;
}

export interface ProjectTestState {
  testFiles: string[];
  suite: ProjectRootNode;
}

export interface ProjectTestsChangedEvent {
  type: "Test";
  testFiles: string[];
  addedTestFiles: string[];
  modifiedTestFiles: string[];
  removedTestFiles: string[];
  updatedSuite: ProjectRootNode;
  invalidatedTestIds: string[];
}

export interface ApplicationChangedEvent {
  type: "App";
  invalidatedTestIds: ["root"];
}

export type ProjectsChangedEvent =
  | {
      type: "projectAdded";
      suite: WorkspaceRootNode;
      addedProject: ProjectRootNode;
    }
  | {
      type: "projectRemoved";
      suite: WorkspaceRootNode;
    }
  | {
      type: "projectAppUpdated";
      suite: WorkspaceRootNode;
      invalidatedTestIds: string[];
    }
  | {
      type: "projectTestsUpdated";
      suite: WorkspaceRootNode;
      testEvent: ProjectTestsChangedEvent;
    };

export interface IDisposable {
  dispose(): void;
}

export const cancellationTokenNone: vscode.CancellationToken = new vscode.CancellationTokenSource().token;

export type TestFileParseResult = (IParseResults & { outcome: "success" }) | TestFileParseFailure;

export interface TestFileParseFailure {
  outcome: "failure";
  file: string;
  error: string;
}
