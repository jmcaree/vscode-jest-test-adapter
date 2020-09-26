import * as vscode from "vscode";
import { ProjectRootNode } from "../helpers/tree";
import { EnvironmentChangedEvent, ProjectTestState } from "../types";

let projectTestState: ProjectTestState = {
  // @ts-ignore
  suite: {},
  testFiles: [],
};
const getTestStateMock: () => Promise<ProjectTestState> = jest.fn(
  async (forceReload: boolean = false) => projectTestState,
);

const loaderMock = jest.fn(() => {
  const eventEmitter = new vscode.EventEmitter<EnvironmentChangedEvent>();

  return {
    dispose: jest.fn(() => {}),
    environmentChange: eventEmitter.event,
    fireEvent: eventEmitter.fire,
    getTestState: getTestStateMock,
  };
});

const __setSuite = (s: ProjectRootNode) => {
  projectTestState = {
    suite: s,
    testFiles: [],
  };
};

export { loaderMock as default, __setSuite };
