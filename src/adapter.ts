import { ProjectWorkspace } from "jest-editor-support";
import _ from "lodash";
import * as vscode from "vscode";
import {
  RetireEvent,
  TestAdapter,
  TestEvent,
  TestLoadFinishedEvent,
  TestLoadStartedEvent,
  TestRunFinishedEvent,
  TestRunStartedEvent,
  TestSuiteEvent,
} from "vscode-test-adapter-api";
import { Log } from "vscode-test-adapter-util";
import { createTree } from "./helpers/createTree";
import { filterTree } from './helpers/filterTree';
import { mapAssertionResultToTestId } from "./helpers/mapAssertionResultToTestId";
import { mapJestAssertionToTestDecorations } from "./helpers/mapJestAssertionToTestDecorations";
import { mapTestIdsToTestFilter } from "./helpers/mapTestIdsToTestFilter";
import { mapTreeToSuite } from "./helpers/mapTreeToSuite";
import { createRootNode, DescribeNode, FileNode, FolderNode, RootNode, TestNode } from "./helpers/tree";
import JestManager, { IJestManagerOptions } from "./JestManager";
import TestLoader from "./TestLoader";

interface IDiposable {
  dispose(): void;
}

export type IJestTestAdapterOptions = IJestManagerOptions;

type TestStateCompatibleEvent = TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent;

export default class JestTestAdapter implements TestAdapter {
  private isLoadingTests: boolean = false;
  private isRunningTests: boolean = false;
  private disposables: IDiposable[] = [];
  private tree: RootNode = createRootNode("root");
  private readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
  private readonly testStatesEmitter = new vscode.EventEmitter<TestStateCompatibleEvent>();
  private readonly retireEmitter = new vscode.EventEmitter<RetireEvent>();
  private readonly autorunEmitter = new vscode.EventEmitter<void>();
  private readonly jestManager: JestManager;

  constructor(
    public readonly workspace: vscode.WorkspaceFolder,
    private readonly log: Log,
    private readonly options: IJestTestAdapterOptions,
  ) {
    this.log.info("Initializing Jest adapter");

    this.jestManager = new JestManager(workspace, options);

    this.disposables.push(this.testsEmitter);
    this.disposables.push(this.testStatesEmitter);
    this.disposables.push(this.retireEmitter);
    this.disposables.push(this.autorunEmitter);
  }

  get autorun(): vscode.Event<void> | undefined {
    return this.autorunEmitter.event;
  }

  get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
    return this.testsEmitter.event;
  }

  get testStates(): vscode.Event<TestStateCompatibleEvent> {
    return this.testStatesEmitter.event;
  }

  get retire(): vscode.Event<RetireEvent> {
    return this.retireEmitter.event;
  }

  public async load(): Promise<void> {
    if (this.isLoadingTests) {
      this.log.info("Test load in progress, ignoring subsequent call to load tests.");
      return;
    }

    this.isLoadingTests = true;
    this.log.info("Loading Jest tests...");

    const testLoader = new TestLoader(this.log, this.initProjectWorkspace());

    try {
      this.testsEmitter.fire({ type: "started" });

      const parsedResults = await testLoader.loadTests();

      const tree = createTree(parsedResults, this.workspace.uri.fsPath);
      this.tree = tree;
      const suite = mapTreeToSuite(tree); // mapJestParseToTestSuiteInfo(parsedResults, this.workspace.uri.fsPath);

      this.testsEmitter.fire({ suite, type: "finished" });
    } catch (error) {
      this.log.error("Error loading tests", JSON.stringify(error));
      this.testsEmitter.fire({ type: "finished", errorMessage: JSON.stringify(error) });
    }

    this.retireAllTests();

    this.log.info("Finished loading Jest tests.");
    this.isLoadingTests = false;
  }

  public async run(tests: string[]): Promise<void> {
    if (this.isRunningTests) {
      this.log.info("Test run in progress, ignoring subsequent call to run tests.");
      return;
    }

    this.log.info(`Running Jest tests... ${JSON.stringify(tests)}`);
    this.isRunningTests = true;
    this.testStatesEmitter.fire({ tests, type: "started" });

    try {
      const testFilter = mapTestIdsToTestFilter(tests);

      // we emit events to notify which tests we are running.
      const filteredTree = filterTree(this.tree, tests);
      this.emitTestRunningRootNode(filteredTree);

      // begin running the tests in Jest.
      const jestResponse = await this.jestManager.runTests(testFilter);

      if (jestResponse) {
        const { reconciler, results } = jestResponse;

        // map the test results to TestEvents
        const testEvents = _.chain(results.testResults)
          .flatMap(fileResult =>
            fileResult.assertionResults.map(
              assertionResult =>
                ({
                  decorations: mapJestAssertionToTestDecorations(assertionResult, fileResult.name, reconciler),
                  state: assertionResult.status,
                  test: mapAssertionResultToTestId(assertionResult, fileResult.name),
                  type: "test",
                  // TODO we should use the 'message' property to display detailed error messages.
                  // message: "error message here."
                } as TestEvent),
            ),
          )
          .value();

        // emit the completion events.
        this.emitTestCompleteRootNode(filteredTree, testEvents);
      }
    } catch (error) {
      this.log.error("Error running tests", JSON.stringify(error));
    }

    this.log.info("Finished loading Jest tests.");
    this.isRunningTests = false;
    this.testStatesEmitter.fire({ type: "finished" });
  }

  public async debug(tests: string[]): Promise<void> {
    const args = ["--runInBand"];
    const testFilter = mapTestIdsToTestFilter(tests);
    if (testFilter) {
      if (testFilter.testFileNamePattern) {
        args.push("--testPathPattern");
        args.push(testFilter.testFileNamePattern);
      }

      if (testFilter.testNamePattern) {
        args.push("--testNamePattern");
        args.push(testFilter.testNamePattern);
      }
    }

    const debugConfiguration: vscode.DebugConfiguration = {
      args,
      console: this.options.debugOutput,
      cwd: "${workspaceFolder}",
      internalConsoleOptions: "neverOpen",
      name: "vscode-jest-test-adapter",
      program: "${workspaceFolder}/node_modules/jest/bin/jest",
      request: "launch",
      type: "node",
    };

    await vscode.debug.startDebugging(this.workspace, debugConfiguration);
  }

  public cancel(): void {
    this.log.info("Closing all active Jest processes");
    this.jestManager.closeAllActiveProcesses();
  }

  public dispose(): void {
    this.cancel();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }

  /**
   * Marks all tests as retired.
   */
  private retireAllTests() {
    this.retireEmitter.fire({});
  }

  private initProjectWorkspace(): ProjectWorkspace {
    const configPath = this.options.pathToConfig(this.workspace);
    const jestPath = this.options.pathToJest(this.workspace);
    return new ProjectWorkspace(
      this.workspace.uri.fsPath,
      jestPath,
      configPath,
      // TODO: lookup version used in project
      20,
      undefined,
      false,
    );
  }

  private emitTestRunningRootNode(root: RootNode) {
    this.testStatesEmitter.fire({
      state: "running",
      suite: root.id,
      type: "suite",
    });

    root.folders.forEach(f => this.emitTestRunningFolder(f));
    root.files.forEach(f => this.emitTestRunningFile(f));
  }

  private emitTestRunningFolder(folder: FolderNode) {
    this.testStatesEmitter.fire({
      state: "running",
      suite: folder.id,
      type: "suite",
    });

    folder.folders.forEach(f => this.emitTestRunningFolder(f));
    folder.files.forEach(f => this.emitTestRunningFile(f));
  }

  private emitTestRunningFile(file: FileNode) {
    this.testStatesEmitter.fire({
      state: "running",
      suite: file.id,
      type: "suite",
    });

    file.describeBlocks.forEach(d => this.emitTestRunningDescribe(d));
    file.tests.forEach(t => this.emitTestRunningTest(t));
  }

  private emitTestRunningDescribe(describe: DescribeNode) {
    this.testStatesEmitter.fire({
      state: "running",
      suite: describe.id,
      type: "suite",
    });
    describe.tests.forEach(t => this.emitTestRunningTest(t));
  }

  private emitTestRunningTest(test: TestNode) {
    this.testStatesEmitter.fire({
      state: "running",
      test: test.id,
      type: "test",
    });
  }

  private emitTestCompleteRootNode(root: RootNode, testEvents: TestEvent[]) {
    this.testStatesEmitter.fire({
      state: "completed",
      suite: root.id,
      type: "suite",
    });

    root.folders.forEach(f => this.emitTestCompleteFolder(f, testEvents));
    root.files.forEach(f => this.emitTestCompleteFile(f, testEvents));
  }

  private emitTestCompleteFolder(folder: FolderNode, testEvents: TestEvent[]) {
    this.testStatesEmitter.fire({
      state: "completed",
      suite: folder.id,
      type: "suite",
    });

    folder.folders.forEach(f => this.emitTestCompleteFolder(f, testEvents));
    folder.files.forEach(f => this.emitTestCompleteFile(f, testEvents));
  }

  private emitTestCompleteFile(file: FileNode, testEvents: TestEvent[]) {
    this.testStatesEmitter.fire({
      state: "completed",
      suite: file.id,
      type: "suite",
    });

    file.describeBlocks.forEach(d => this.emitTestCompleteDescribe(d, testEvents));
    file.tests.forEach(t => this.emitTestCompleteTest(t, testEvents));
  }

  private emitTestCompleteDescribe(describe: DescribeNode, testEvents: TestEvent[]) {
    this.testStatesEmitter.fire({
      state: "completed",
      suite: describe.id,
      type: "suite",
    });
    describe.tests.forEach(t => this.emitTestCompleteTest(t, testEvents));
  }

  private emitTestCompleteTest(test: TestNode, testEvents: TestEvent[]) {
    const testEvent = testEvents.find(e => e.test === test.id);
    if (testEvent) {
      this.testStatesEmitter.fire(testEvent);
    }
  }
}
