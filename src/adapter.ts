import * as vscode from "vscode";
import {
  TestAdapter,
  TestEvent,
  TestLoadFinishedEvent,
  TestLoadStartedEvent,
  TestRunFinishedEvent,
  TestRunStartedEvent,
  TestSuiteEvent,
} from "vscode-test-adapter-api";
import { Log } from "vscode-test-adapter-util";
import {
  mapJestAssertionToTestInfo,
  mapJestFileResultToTestSuiteInfo,
  mapJestTotalResultToTestSuiteInfo,
  mapTestIdsToTestFilter,
} from "./helpers/mapJestToTestAdapter";
import JestManager from "./JestManager";

interface IDiposable {
  dispose(): void;
}

type TestStateCompatibleEvent = TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent;

export default class JestTestAdapter implements TestAdapter {

  private disposables: IDiposable[] = [];

  private readonly testsEmitter = new vscode.EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
  private readonly testStatesEmitter = new vscode.EventEmitter<TestStateCompatibleEvent>();
  private readonly autorunEmitter = new vscode.EventEmitter<void>();

  get autorun(): vscode.Event<void> | undefined {
    return this.autorunEmitter.event;
  }

  get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
    return this.testsEmitter.event;
  }

  get testStates(): vscode.Event<TestStateCompatibleEvent> {
    return this.testStatesEmitter.event;
  }

  constructor(
    public readonly workspace: vscode.WorkspaceFolder,
    private readonly log: Log,
  ) {

    this.log.info("Initializing Jest adapter");

    this.disposables.push(this.testsEmitter);
    this.disposables.push(this.testStatesEmitter);
    this.disposables.push(this.autorunEmitter);

  }

  public async load(): Promise<void> {

    this.log.info("Loading Jest tests");

    this.testsEmitter.fire({
      type: "started",
    } as TestLoadStartedEvent);

    const jest = new JestManager(this.workspace);
    const loadedTests = await jest.loadTests();
    const suite = mapJestTotalResultToTestSuiteInfo(loadedTests, this.workspace.uri.fsPath);

    this.testsEmitter.fire({
      suite,
      type: "finished",
    } as TestLoadFinishedEvent);

  }

  public async run(tests: string[]): Promise<void> {

    this.log.info(`Running Jest tests ${JSON.stringify(tests)}`);

    this.testStatesEmitter.fire({
      tests,
      type: "started",
    } as TestRunStartedEvent);

    const jest = new JestManager(this.workspace);
    const testFilter = mapTestIdsToTestFilter(tests);
    const jestResults = await jest.runTests(testFilter);

    jestResults.testResults.forEach((fileResult) => {
      this.testStatesEmitter.fire({
        state: "running",
        suite: mapJestFileResultToTestSuiteInfo(fileResult, this.workspace.uri.fsPath),
        type: "suite",
      } as TestSuiteEvent);

      fileResult.assertionResults.forEach((assertionResult) => {
        this.testStatesEmitter.fire({
          state: assertionResult.status,
          test: mapJestAssertionToTestInfo(assertionResult, fileResult.name),
          type: "test",
        } as TestEvent);
      });

      this.testStatesEmitter.fire({
        state: "completed",
        suite: mapJestFileResultToTestSuiteInfo(fileResult, this.workspace.uri.fsPath),
        type: "suite",
      } as TestSuiteEvent);
    });

    this.testStatesEmitter.fire({
      type: "finished",
    } as TestRunFinishedEvent);

  }

  public async debug(tests: string[]): Promise<void> {
    // in a "real" TestAdapter this would start a test run in a child process and attach the debugger to it
    this.log.warn("debug() not implemented yet");
    throw new Error("Method not implemented.");
  }

  public cancel(): void {
    // in a "real" TestAdapter this would kill the child process for the current test run (if there is any)
    throw new Error("Method not implemented.");
  }

  public dispose(): void {
    this.cancel();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
