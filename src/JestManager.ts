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

export default class JestManager {

  private readonly projectWorkspace: ProjectWorkspace;

  constructor(
    public readonly workspace: WorkspaceFolder,
  ) {
    this.projectWorkspace = this.initProjectWorkspace();
  }

  public loadTests(): Promise<JestTotalResults> {
    return this.runJest();
  }

  private async runJest(tests: string[] | null = null): Promise<JestTotalResults> {
    return new Promise<JestTotalResults>((resolve, reject) => {
      const runner = this.createRunner(tests);
      runner
        .once("executableJSON", (data: JestTotalResults) => resolve(data))
        .once("exception", (result) => reject(result))
        .once("terminalError", (result) => reject(result));
      runner.start(false);
    });
  }

  private createRunner(tests: string[] | null = null): Runner {
    const useShell = platform() === "win32";

    const options: Options = {
      shell: useShell,
    };

    if (tests) {
      // Test matching is done by creating a regular expression out of the specified test IDs
      if (tests[0] && tests[0].startsWith("^")) {
        // Test filter is a name
        options.testNamePattern = `"(${tests.join("|")})"`;
      } else {
        // Test filter is a file path
        options.testFileNamePattern = `"(${tests.join("|")})"`;
      }
    }

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
