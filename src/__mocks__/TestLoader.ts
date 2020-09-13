import * as vscode from "vscode";
import { EnvironmentChangedEvent, ProjectTestState } from "../types";

const projectTestState: ProjectTestState = {
  // @ts-ignore
  suite: {},
  testFiles: [],
};
const getTestStateMock: () => Promise<ProjectTestState> = jest.fn(
  async (forceReload: boolean = false) => projectTestState,
);

const loaderMock = jest.fn(() => {
  const eventEmitter = new vscode.EventEmitter<EnvironmentChangedEvent>();

  return ({
    dispose: jest.fn(() => { }),
    environmentChange: eventEmitter.event,
    fireEvent: eventEmitter.fire,
    getTestState: getTestStateMock,
  });
});

export default loaderMock;
