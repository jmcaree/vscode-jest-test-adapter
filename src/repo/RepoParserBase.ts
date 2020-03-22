import vscode from "vscode";
import { RepoParser } from '.';

export default class RepoParserBase implements Pick<RepoParser, "projectChange"> {
  private projectChangedEmitter: vscode.EventEmitter<any>;

  constructor() {
    this.projectChangedEmitter = new vscode.EventEmitter<any>();
  }

  public get projectChange() {
    return this.projectChangedEmitter.event;
  }
}
