import {
  JestTotalResults,
  Options,
  ProjectWorkspace,
  Runner,
} from "jest-editor-support";
import { platform } from "os";
import { WorkspaceFolder } from "vscode";
import pathToConfig from "./helpers/pathToConfig";
import pathToJest from "./helpers/pathToJest";
import { ITestFilter } from "./types";

export default class JestManager {

  private readonly projectWorkspace: ProjectWorkspace;

  constructor(
    public readonly workspace: WorkspaceFolder,
  ) {
    this.projectWorkspace = this.initProjectWorkspace();
  }

  public loadTests(): Promise<JestTotalResults> {
    return this.runTests();
  }

  public async runTests(testFilter?: ITestFilter | null): Promise<JestTotalResults> {
    return new Promise<JestTotalResults>((resolve, reject) => {
      const runner = this.createRunner(testFilter);
      runner
        .once("executableJSON", (data: JestTotalResults) => resolve(data))
        .once("exception", (result) => reject(result))
        .once("terminalError", (result) => reject(result));
      // // tslint:disable-next-line:no-console
      // .on("executableStdErr", (x: Buffer) => console.log(x.toString()))
      // // tslint:disable-next-line:no-console
      // .on("executableOutput", (x) => console.log(x))
      // // tslint:disable-next-line:no-console
      // .on("debuggerProcessExit", () => console.log("debuggerProcessExit"));
      runner.start(false);
    });
  }

  private createRunner(testFilter?: ITestFilter | null): Runner {
    const useShell = platform() === "win32";

    const options: Options = {
      shell: useShell,
      ...(testFilter || {}),
    };

    return new Runner(this.projectWorkspace, options);
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
