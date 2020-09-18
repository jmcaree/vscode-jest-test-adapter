import { Log } from "vscode-test-adapter-util";
import { createFileSystem, resetFileSystem } from "../../utils";
import { StandardParser } from "../StandardParser";

// core node modules need explicit mocking.
jest.mock("fs");

describe("StandardParser Tests", () => {
  beforeEach(() => {
    resetFileSystem();
  });

  const packageFileWithJestDependency = {
    dependencies: {
      jest: "^24.0.0",
    },
    name: "dummy",
    version: "1.0.0",
  };

  const packageFileWithJestDevDependency = {
    devDependencies: {
      jest: "^24.0.0",
    },
    name: "dummy",
    version: "1.0.0",
  };

  const packageFileWithJestPeerDependency = {
    name: "dummy",
    peerDependencies: {
      jest: "^24.0.0",
    },
    version: "1.0.0",
  };

  const packageFileWithJestOptionalDependency = {
    name: "dummy",
    optionalDependencies: {
      jest: "^24.0.0",
    },
    version: "1.0.0",
  };

  const packageFileWithoutJestDependency = {
    name: "dummy",
    optionalDependencies: {},
    version: "1.0.0",
  };

  it.each`
    config                                   | expectedToMatch
    ${packageFileWithJestDependency}         | ${true}
    ${packageFileWithJestDevDependency}      | ${true}
    ${packageFileWithJestPeerDependency}     | ${true}
    ${packageFileWithJestOptionalDependency} | ${true}
    ${packageFileWithoutJestDependency}      | ${false}
  `(
    `Given a StandardParser and the given package file
     when 'isMatch' is invoked
     then the result is '$expectedToMatch'`,
    async ({ config, expectedToMatch }: { config: any; expectedToMatch: boolean }) => {
      const workspaceRoot = "/";
      // @ts-ignore
      const log: Log = {};
      const pathToJest = "";
      const parser = new StandardParser(workspaceRoot, log, pathToJest);

      createFileSystem({ "package.json": config });

      const result = await parser.isMatch();

      expect(result).toBe(expectedToMatch);
    },
  );
});
