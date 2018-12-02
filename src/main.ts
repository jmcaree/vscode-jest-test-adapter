import * as vscode from "vscode";
import { testExplorerExtensionId, TestHub } from "vscode-test-adapter-api";
import { Log, TestAdapterRegistrar } from "vscode-test-adapter-util";
import JestTestAdapter from "./adapter";

export async function activate(context: vscode.ExtensionContext) {

  const workspaceFolder = (vscode.workspace.workspaceFolders || [])[0];

  // create a simple logger that can be configured with the configuration variables
  // `jestTestExplorer.logpanel` and `jestTestExplorer.logfile`
  const log = new Log("jestTestExplorer", workspaceFolder, "Jest Test Explorer Log");
  context.subscriptions.push(log);

  // get the Test Explorer extension
  const testExplorerExtension = vscode.extensions.getExtension<TestHub>(testExplorerExtensionId);
  if (log.enabled) { log.info(`Test Explorer ${testExplorerExtension ? "" : "not "}found`); }

  if (testExplorerExtension) {

    const testHub = testExplorerExtension.exports;

    // this will register a JestTestAdapter for each WorkspaceFolder
    context.subscriptions.push(new TestAdapterRegistrar(
      testHub,
      (wf) => new JestTestAdapter(wf, log),
      log,
    ));
  }
}
