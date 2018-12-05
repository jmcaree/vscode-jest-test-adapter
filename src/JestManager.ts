import {
  JestTotalResults,
  Options,
  ProjectWorkspace,
  Runner,
  TestReconciler,
} from "jest-editor-support";
import { platform } from "os";
import { WorkspaceFolder } from "vscode";
import pathToConfig from "./helpers/pathToConfig";
import pathToJest from "./helpers/pathToJest";
import { IJestResponse, ITestFilter } from "./types";

export default class JestManager {

  private readonly projectWorkspace: ProjectWorkspace;
  private readonly activeRunners: Set<Runner> = new Set<Runner>();

  constructor(
    public readonly workspace: WorkspaceFolder,
  ) {
    this.projectWorkspace = this.initProjectWorkspace();
  }

  public closeAllActiveProcesses(): void {
    [...this.activeRunners].forEach((r) => {
      r.closeProcess();
    });
    this.activeRunners.clear();
  }

  public loadTests(): Promise<IJestResponse | null> {
    return this.runTests();
  }

  public async runTests(testFilter?: ITestFilter | null): Promise<IJestResponse | null> {
    const results = await new Promise<JestTotalResults | null>((resolve, reject) => {
      const runner = this.createRunner(testFilter);
      runner
        .once("executableJSON", (data: JestTotalResults) => resolve(data))
        .once("exception", (result) => reject(result))
        .once("terminalError", (result) => reject(result))
        .once("debuggerProcessExit", () => resolve(null));
      runner.start(false);
    });
    if (!results) {
      return null;
    }

    const reconciler = new TestReconciler();
    reconciler.updateFileWithJestStatus(results);

    return {
      reconciler,
      results,
    };
  }

  private createRunner(testFilter?: ITestFilter | null): Runner {
    const useShell = platform() === "win32";

    const options: Options = {
      shell: useShell,
      ...(testFilter || {}),
    };

    const runner = new Runner(this.projectWorkspace, options);
    this.activeRunners.add(runner);
    return runner
      // // tslint:disable-next-line:no-console
      // .on("executableStdErr", (x: Buffer) => console.log(x.toString()))
      // // tslint:disable-next-line:no-console
      // .on("executableOutput", (x) => console.log(x))
      .once("debuggerProcessExit", () => this.activeRunners.delete(runner));
  }

  private initProjectWorkspace(): ProjectWorkspace {
    const configPath = pathToConfig();
    const jestPath = pathToJest(this.workspace);
    return new ProjectWorkspace(
      this.workspace.uri.fsPath,
      jestPath,
      configPath,
      // TOOD: lookup version used in project
      20,
      false,
      false,
    );
  }
}
