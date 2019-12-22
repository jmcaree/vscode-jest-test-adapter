import { JestAssertionResults, TestReconciler } from "jest-editor-support";
import { TestDecoration } from "vscode-test-adapter-api";

export function mapJestAssertionToTestDecorations(
  assertionResult: JestAssertionResults,
  fileName: string,
  reconciler: TestReconciler,
) {
  // TODO convert this to functional code.
  const decorations: TestDecoration[] = [];

  // TODO we are calling this method for each assertionResult even though it returns the same value for each assertionResult
  // in the same file.  We should optimise this.
  const assertions = reconciler.assertionsForTestFile(fileName);
  if (assertions) {
    const matchingAssertion = assertions.find(x => x.title === assertionResult.title);
    
    if (matchingAssertion && matchingAssertion.line) {
      decorations.push({
        // TODO we could have a extension config item that controls which message type to show on hover.
        hover: matchingAssertion.shortMessage,
        line: matchingAssertion.line - 1,
        message: matchingAssertion.terseMessage || "TERSE MESSAGE MISSING",
      });
    }
  }
  return decorations;
}
