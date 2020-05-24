import { TestEvent, TestRunFinishedEvent, TestRunStartedEvent, TestSuiteEvent } from "vscode-test-adapter-api";
import {
  DescribeNode,
  FileNode,
  FileWithParseErrorNode,
  FolderNode,
  ProjectRootNode,
  TestNode,
  WorkspaceRootNode,
} from "./tree";

const emitTestCompleteRootNode = (
  root: WorkspaceRootNode | ProjectRootNode,
  testEvents: TestEvent[],
  eventEmitter: (data: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent) => void,
): void => {
  switch (root.type) {
    case "workspaceRootNode":
      emitTestCompleteWorkspaceRootNode(root, testEvents, eventEmitter);
      break;

    case "projectRootNode":
      emitTestCompleteProjectRootNode(root, testEvents, eventEmitter);
      break;
  }
};

const emitTestCompleteWorkspaceRootNode = (
  root: WorkspaceRootNode,
  testEvents: TestEvent[],
  eventEmitter: (data: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent) => void,
) => {
  eventEmitter({
    state: "running",
    suite: root.id,
    type: "suite",
  });

  root.projects.forEach(p => emitTestCompleteProjectRootNode(p, testEvents, eventEmitter));

  eventEmitter({
    state: "completed",
    suite: root.id,
    type: "suite",
  });
};

const emitTestCompleteProjectRootNode = (
  root: ProjectRootNode,
  testEvents: TestEvent[],
  eventEmitter: (data: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent) => void,
) => {
  eventEmitter({
    state: "running",
    suite: root.id,
    type: "suite",
  });

  root.files.forEach(f => emitTestCompleteFile(f, testEvents, eventEmitter));
  root.folders.forEach(f => emitTestCompleteFolder(f, testEvents, eventEmitter));

  eventEmitter({
    state: "completed",
    suite: root.id,
    type: "suite",
  });
};

const emitTestCompleteFolder = (
  folder: FolderNode,
  testEvents: TestEvent[],
  eventEmitter: (data: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent) => void,
) => {
  eventEmitter({
    state: "running",
    suite: folder.id,
    type: "suite",
  });

  folder.files.forEach(f => emitTestCompleteFile(f, testEvents, eventEmitter));
  folder.folders.forEach(f => emitTestCompleteFolder(f, testEvents, eventEmitter));

  eventEmitter({
    state: "completed",
    suite: folder.id,
    type: "suite",
  });
};

const emitTestCompleteFile = (
  file: FileNode | FileWithParseErrorNode,
  testEvents: TestEvent[],
  eventEmitter: (data: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent) => void,
) => {
  eventEmitter({
    state: "running",
    suite: file.id,
    type: "suite",
  });

  switch (file.type) {
    case "file":
      file.tests.forEach(t => emitTestCompleteTest(t, testEvents, eventEmitter));
      file.describeBlocks.forEach(d => emitTestCompleteDescribe(d, testEvents, eventEmitter));

      eventEmitter({
        state: "completed",
        suite: file.id,
        type: "suite",
      });
      break;

    case "fileWithParseError":
      // Currently we do not emit anything to indicate that we are running the files with parse errors.  This may not
      // be the correct choice...
      break;
  }
};

const emitTestCompleteDescribe = (
  describe: DescribeNode,
  testEvents: TestEvent[],
  eventEmitter: (data: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent) => void,
) => {
  eventEmitter({
    state: "running",
    suite: describe.id,
    type: "suite",
  });

  describe.tests.forEach(t => emitTestCompleteTest(t, testEvents, eventEmitter));
  describe.describeBlocks.forEach(d => emitTestCompleteDescribe(d, testEvents, eventEmitter));

  eventEmitter({
    state: "completed",
    suite: describe.id,
    type: "suite",
  });
};

const emitTestCompleteTest = (
  test: TestNode,
  testEvents: TestEvent[],
  eventEmitter: (data: TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent) => void,
) => {
  const testEvent = testEvents.find(e => e.test === test.id);

  if (testEvent) {
    eventEmitter({
      state: "running",
      test: test.id,
      type: "test",
    });

    eventEmitter(testEvent);
  }
};

export { emitTestCompleteRootNode };
