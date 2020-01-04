// A dummy test file to ensure that tests are working in CI/CD pipeline before adding real tests.

import { createTree } from "../createTree";

// tslint:disable: no-empty
describe("Dummy tests", () => {
  test("A dummy test", () => {
    const result = createTree([], "")
    expect(result).not.toBeNull();
  })
})