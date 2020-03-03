import { ProjectWorkspace } from "jest-editor-support";
import { WorkspaceFolder } from "vscode";
import { JestTestAdapterOptions } from "../JestManager";

function initProjectWorkspace(options: JestTestAdapterOptions, workspace: WorkspaceFolder): ProjectWorkspace;
function initProjectWorkspace(configPath: string, jestPath: string, workspaceFolder: string): ProjectWorkspace;
function initProjectWorkspace(first: any, second: any, third?: any): ProjectWorkspace {
  let configPath: string;
  let jestPath: string;
  let workspaceFolder: string;

  if (typeof first === "string") {
    configPath = first;
    jestPath = second;
    workspaceFolder = third;
  } else if (typeof first === "object") {
    const options: JestTestAdapterOptions = first;
    const workspace: WorkspaceFolder = second;
    configPath = options.pathToConfig(workspace);
    jestPath = options.pathToJest(workspace);
    workspaceFolder = workspace.uri.fsPath;
  } else {
    throw new Error("Incorrect parameters provided.")
  }

  return new ProjectWorkspace(
    workspaceFolder,
    jestPath,
    configPath,
    // TODO: lookup version used in project
    20,
    // TODO not sure if this is correct...
    undefined,
    false,
    false,
  );
}

export  {initProjectWorkspace};
