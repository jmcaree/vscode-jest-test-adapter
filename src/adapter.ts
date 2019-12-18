import { JestFileResults, ProjectWorkspace, TestReconciler } from "jest-editor-support";
import * as vscode from "vscode";
import {
  RetireEvent,
  TestAdapter,
  TestEvent,
  TestInfo,
  TestLoadFinishedEvent,
  TestLoadStartedEvent,
  TestRunFinishedEvent,
  TestRunStartedEvent,
  TestSuiteEvent,
  TestSuiteInfo,
} from "vscode-test-adapter-api";
import { Log } from "vscode-test-adapter-util";
import { createTree } from "./helpers/createTree";
import {
  mapJestAssertionToTestDecorations,
  mapJestAssertionToTestInfo,
  mapJestFileResultToTestSuiteInfo,
  mapTestIdsToTestFilter,
} from "./helpers/mapJestToTestAdapter";
import { mapTreeToSuite } from "./helpers/mapTreeToSuite";
import { RootNode } from "./helpers/tree";
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
  // @ts-ignore
  private tree: RootNode | undefined;
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
      console.log(tree)
      console.log(suite)

      this.testsEmitter.fire({ suite, type: "finished" });
    } catch (error) {
      this.log.error("Error loading tests", JSON.stringify(error));
      this.testsEmitter.fire({ type: "finished", errorMessage: JSON.stringify(error) });
    }

    this.retireAllTests()

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
      const jestResponse = await this.jestManager.runTests(testFilter);

      if (jestResponse) {
        const { reconciler, results } = jestResponse;
        results.testResults.forEach(fileResult => this.processFileResult(fileResult, reconciler));
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

  private processFileResult(fileResult: JestFileResults, reconciler: TestReconciler) {
    const suite = mapJestFileResultToTestSuiteInfo(fileResult, this.workspace.uri.fsPath);

    this.fireSuiteStarting(suite);

    fileResult.assertionResults.forEach(assertionResult => {
      const test = mapJestAssertionToTestInfo(assertionResult, fileResult);
      const testRunEvent: TestEvent = {
        decorations: mapJestAssertionToTestDecorations(assertionResult, fileResult.name, reconciler),
        state: assertionResult.status,
        test,
        type: "test",
      };
      this.testStatesEmitter.fire(testRunEvent);
    });

    this.fireSuiteComplete(suite);
  }

  private processSuite(suite: TestSuiteInfo) {
    this.fireSuiteStarting(suite);
    suite.children.forEach(c => {
      if (c.type === "suite") {
        this.processSuite(c);
      } else {
        this.processTest(c);
      }
    });
    this.fireSuiteComplete(suite);
  }

  private processTest(test: TestInfo) {
    const testRunEvent = {
      // decorations: mapJestAssertionToTestDecorations(assertionResult, fileResult.name, reconciler),
      state: "passed", // assertionResult.status,
      test,
      type: "test",
    } as TestEvent;
    this.testStatesEmitter.fire(testRunEvent);
  }

  private fireSuiteStarting(suite: TestSuiteInfo) {
    const suiteStartEvent: TestSuiteEvent = {
      state: "running",
      suite,
      type: "suite",
    };
    this.testStatesEmitter.fire(suiteStartEvent);

    suite.children.filter(c => c.type === "suite").forEach(s => this.fireSuiteStarting(s as TestSuiteInfo));
  }

  private fireSuiteComplete(suite: TestSuiteInfo) {
    const suiteEndEvent = {
      state: "completed",
      suite,
      type: "suite",
    } as TestSuiteEvent;
    this.testStatesEmitter.fire(suiteEndEvent);

    suite.children.filter(c => c.type === "suite").forEach(s => this.fireSuiteComplete(s as TestSuiteInfo));
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
}
