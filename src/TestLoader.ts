import * as fs from "fs";
import {
  IParseResults,
  parse,
  ProjectWorkspace,
  Settings,
} from "jest-editor-support";
import * as mm from "micromatch";
import * as path from "path";
import { Log } from "vscode-test-adapter-util";

type Matcher = (value: string) => boolean;

/**
 * Glob patterns to globally ignore when searching for tests.
 * Only universally recognized patterns should be used here, such as node_modules.
 */
const IGNORE_GLOBS = [
  "node_modules",
];

/**
 * Returns true if the specified path is a directory, false otherwise.
 * @param directory The full file system path to the check.
 */
function checkIsDirectory(directory: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    fs.stat(directory, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats.isDirectory());
      }
    });
  });
}

/**
 * Creates a matcher function that returns true if a file should be explored for tests, false otherwise.
 * @param settings The Jest settings.
 */
function createMatcher(settings: Settings): Matcher {
  if (settings.settings.testRegex) {
    const regex = new RegExp(settings.settings.testRegex);
    return (value) => regex.test(value);
  } else {
    return (value) => mm.any(value, settings.settings.testMatch);
  }
}

/**
 * Explores a directory recursively and returns the TestSuiteInfo representing the directory.
 * @param directory The full file system path to the directory.
 * @param matcher The matcher function to use to determine if a file includes tests.
 */
async function exploreDirectory(directory: string, matcher: Matcher): Promise<IParseResults[]> {
  const contents = await getDirectoryContents(directory);
  const files = await Promise.all(contents.map((x) => evaluateFilePath(x, matcher)));

  // some alternatives methods are not accepted by TS
  return Array.prototype.concat(...files);
}

/**
 * Evaluates a file path and returns the TestSuiteInfo representing it.
 * If the path is a directory, it will recursively explore it.
 * If the path is a file, it will parse the contents and search for test blocks.
 * If the directory or file did not include any tests, null will be returned.
 * @param filePath The file path to evaluate.
 * @param matcher The matcher function to use to determine if a file includes tests.
 */
async function evaluateFilePath(filePath: string, matcher: Matcher): Promise<IParseResults[]> {
  const isDirectory = await checkIsDirectory(filePath);
  if (isDirectory) {
    return await exploreDirectory(filePath, matcher);
  } else if (matcher(filePath)) {
    return [parse(filePath)];
  } else {
    return [];
  }
}

/**
 * Retrieves the contents of a directory and outputs their absolute paths.
 * Includes both files and directories.
 * Excludes glob patterns included in IGNORE_GLOBS.
 * @param directory Returns an array of absolute paths representing the items within the directory.
 */
function getDirectoryContents(directory: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        const includedFiles = mm.not(files, IGNORE_GLOBS);
        resolve(includedFiles.map((f) => path.join(directory, f)));
      }
    });
  });
}

export default class TestLoader {
  constructor(
    private readonly log: Log,
    private readonly projectWorkspace: ProjectWorkspace,
  ) {
  }

  public async loadTests() {
    this.log.info(`Loading Jest settings from ${this.projectWorkspace.pathToConfig}`);
    const settings = new Settings(this.projectWorkspace);
    this.log.info("Jest settings loaded");

    this.log.info("Loading Jest tests");
    const matcher = createMatcher(settings);
    const parsedResults = await exploreDirectory(this.projectWorkspace.rootPath, matcher);
    this.log.info("Test load complete");

    return parsedResults;
  }
}
