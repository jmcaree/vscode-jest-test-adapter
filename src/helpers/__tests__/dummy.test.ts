// A dummy test file to ensure that tests are working in CI/CD pipeline before adding real tests.

import { mergeTree } from "../createTree";
import { createProjectNode } from "../tree";

describe("Dummy tests", () => {
  test("A dummy test", () => {
    const result = mergeTree(createProjectNode("", "", "", ""), [], "")
    expect(result).not.toBeNull();
  })
})