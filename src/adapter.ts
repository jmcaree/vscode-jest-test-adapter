import { ProjectWorkspace } from "jest-editor-support";
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
  mapJestAssertionToTestDecorations,
  mapJestAssertionToTestInfo,
  mapJestFileResultToTestSuiteInfo,
  mapJestParseToTestSuiteInfo,
  mapTestIdsToTestFilter,
} from "./helpers/mapJestToTestAdapter";
import JestManager, { IJestManagerOptions } from "./JestManager";
import TestLoader from "./TestLoader";

interface IDiposable {
  dispose(): void;
}

export type IJestTestAdapterOptions = IJestManagerOptions;

type TestStateCompatibleEvent =
  | TestRunStartedEvent
  | TestRunFinishedEvent
  | TestSuiteEvent
  | TestEvent;

export default class JestTestAdapter implements TestAdapter {
  get autorun(): vscode.Event<void> | undefined {
    return this.autorunEmitter.event;
  }

  get tests(): vscode.Event<TestLoadStartedEvent | TestLoadFinishedEvent> {
    return this.testsEmitter.event;
  }

  get testStates(): vscode.Event<TestStateCompatibleEvent> {
    return this.testStatesEmitter.event;
  }
  private disposables: IDiposable[] = [];

  private readonly testsEmitter = new vscode.EventEmitter<
    TestLoadStartedEvent | TestLoadFinishedEvent
  >();
  private readonly testStatesEmitter = new vscode.EventEmitter<
    TestStateCompatibleEvent
  >();
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
    this.disposables.push(this.autorunEmitter);
  }

  public async load(): Promise<void> {
    this.log.info("Loading Jest tests");

    const testLoader = new TestLoader(
      this.log,
      this.initProjectWorkspace(),
    );

    this.testsEmitter.fire({
      type: "started",
    } as TestLoadStartedEvent);

    const parsedResults = await testLoader.loadTests();
    const suite = mapJestParseToTestSuiteInfo(
      parsedResults,
      this.workspace.uri.fsPath,
    );

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

    const testFilter = mapTestIdsToTestFilter(tests);
    const jestResponse = await this.jestManager.runTests(testFilter);
    if (jestResponse) {
      const { reconciler, results } = jestResponse;
      results.testResults.forEach((fileResult) => {
        this.testStatesEmitter.fire({
          state: "running",
          suite: mapJestFileResultToTestSuiteInfo(
            fileResult,
            this.workspace.uri.fsPath,
          ),
          type: "suite",
        } as TestSuiteEvent);

        fileResult.assertionResults.forEach((assertionResult) => {
          this.testStatesEmitter.fire({
            decorations: mapJestAssertionToTestDecorations(
              assertionResult,
              fileResult.name,
              reconciler,
            ),
            state: assertionResult.status,
            test: mapJestAssertionToTestInfo(assertionResult, fileResult),
            type: "test",
          } as TestEvent);
        });

        this.testStatesEmitter.fire({
          state: "completed",
          suite: mapJestFileResultToTestSuiteInfo(
            fileResult,
            this.workspace.uri.fsPath,
          ),
          type: "suite",
        } as TestSuiteEvent);
      });

      this.testStatesEmitter.fire({
        type: "finished",
      } as TestRunFinishedEvent);
    } else {
      // Test run was canceled
      this.testStatesEmitter.fire({
        type: "finished",
      } as TestRunFinishedEvent);
    }
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

  private initProjectWorkspace(): ProjectWorkspace {
    const configPath = this.options.pathToConfig(this.workspace);
    const jestPath = this.options.pathToJest(this.workspace);
    return new ProjectWorkspace(
      this.workspace.uri.fsPath,
      jestPath,
      configPath,
      // TODO: lookup version used in project
      20,
      "log",
      false,
      false,
    );
  }
}
