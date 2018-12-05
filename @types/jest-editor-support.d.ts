import * as jest from "jest-editor-support";

declare module "jest-editor-support" {
  interface JestAssertionResults {
    ancestorTitles: string[] | null;
  }
}
