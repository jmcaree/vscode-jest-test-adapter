import { JSONSchemaForNPMPackageJsonFiles } from "@schemastore/package";
import fs from "fs";
import path from "path";
import util from "util";
import vscode from "vscode";
import { Log } from "vscode-test-adapter-util";
import { RepoParser } from ".";

// the following requires Node 8 minimum.
export const readFile = util.promisify(fs.readFile);

export default class RepoParserBase implements Pick<RepoParser, "projectChange"> {
  private projectChangedEmitter: vscode.EventEmitter<any>;

  constructor(protected workspaceRoot: string, protected log: Log, protected pathToJest: string) {
    this.projectChangedEmitter = new vscode.EventEmitter<any>();
  }

  public get projectChange() {
    return this.projectChangedEmitter.event;
  }

  protected getJestCommandAndDirectory() {
    if (this.pathToJest === "jest") {
      // globally installed jest.
      return { jestCommand: "jest", jestExecutionDirectory: this.workspaceRoot };
    } else {
      // jest is locally installed.
      const jestCommand = path.relative(this.workspaceRoot, this.pathToJest);
      return { jestCommand, jestExecutionDirectory: this.workspaceRoot };
    }
  }

  protected async getPackageFile(workspaceRoot: string): Promise<JSONSchemaForNPMPackageJsonFiles | null> {
    const packageJsonPath = path.resolve(workspaceRoot, "package.json");

    try {
      const contents = await readFile(packageJsonPath);
      return JSON.parse(contents.toString()) as JSONSchemaForNPMPackageJsonFiles;
    } catch (error) {
      // often this will be because the file doesn't exist although other file access issues could happen.
      return null;
    }
  }
}
