import { IParseResults, ItBlock } from "jest-editor-support";
import _ from "lodash";
import { parse, sep as pathSeparator } from "path";
import { DESCRIBE_ID_SEPARATOR, TEST_ID_SEPARATOR } from "../constants";
import {
  createDescribeNode,
  createFileNode,
  createFolderNode,
  createRootNode,
  createTestNode,
  FolderNode,
  RootNode,
} from "./tree";

interface ParseInfo {
  /**
   * The name of the file with extension without the full path.
   */
  fileName: string;
  /**
   * An array with the folder details from the workspace root to the test file.
   */
  folders: Array<{
    /**
     * The full path to the folder.
     */
    id: string;
    /**
     * The name of the sub folder.
     */
    name: string;
  }>;
  /**
   * The original parse result.
   */
  parseResult: IParseResults;
}

const process = (parseResults: IParseResults[], workspaceRoot: string, root: RootNode): RootNode => {
  const infos = _.chain(parseResults)
    .map(x => toParseInfo(x, workspaceRoot))
    .sortBy(x => x.folders.length > 0)
    .value();

  infos.forEach(info => {
    const { file, describeBlocks, itBlocks } = info.parseResult;

    // process all the folder nodes...
    let currentFolderNode: RootNode | FolderNode = root;
    info.folders.forEach(f => {
      const existingFolderNode = currentFolderNode.folders.find(n => n.id === f.id);
      // create folder node and set current node to new node.
      if (existingFolderNode) {
        currentFolderNode = existingFolderNode;
      } else {
        const newNode = createFolderNode(f.id, f.name);
        currentFolderNode.folders = currentFolderNode.folders.concat(newNode);
        currentFolderNode = newNode;
      }
    });

    // process file node...
    let fileNode = currentFolderNode.files.find(f => f.id === file);
    if (!fileNode) {
      fileNode = createFileNode(file, info.fileName, file);
      currentFolderNode.files = currentFolderNode.files.concat(fileNode);
    }

    const describeBlocksWithTests = describeBlocks.map(d => ({ ...d, itBlocks: [] as ItBlock[] }));
    const standaloneTests = [] as ItBlock[];

    itBlocks.forEach(it => {
      const itStartLine = it.start.line;
      const matchingDescribeBlock = describeBlocksWithTests.find(
        d => d.start.line <= itStartLine && itStartLine <= d.end.line,
      );
      if (matchingDescribeBlock) {
        matchingDescribeBlock.itBlocks.push(it);
      } else {
        standaloneTests.push(it);
      }
    });

    // process all describe nodes...
    describeBlocksWithTests.forEach(d => {
      const expectedDescribeBlockId = `${fileNode!.id}${DESCRIBE_ID_SEPARATOR}${d.name}`;
      let describeNode = fileNode!.describeBlocks.find(x => x.id === expectedDescribeBlockId);
      if (!describeNode) {
        describeNode = createDescribeNode(expectedDescribeBlockId, d.name, file, d.start.line - 1);
        fileNode!.describeBlocks = fileNode!.describeBlocks.concat(describeNode);
      }

      // process all the tests within this describe block...
      d.itBlocks.forEach(it => {
        const expectedTestId = `${expectedDescribeBlockId}${TEST_ID_SEPARATOR}${it.name}`;
        let testNode = describeNode!.tests.find(t => t.id === expectedTestId);
        if (!testNode) {
          testNode = createTestNode(expectedTestId, it.name, file, it.start.line - 1);
          describeNode!.tests = describeNode!.tests.concat(testNode);
        }
      });
    });

    // process all test nodes...
    standaloneTests.forEach(it => {
      const expectedTestId = `${fileNode!.id}${TEST_ID_SEPARATOR}${it.name}`;
      let testNode = fileNode!.tests.find(t => t.id === expectedTestId);
      if (!testNode) {
        testNode = createTestNode(expectedTestId, it.name, file, it.start.line - 1);
        fileNode!.tests = fileNode!.tests.concat(testNode);
      }
    });
  });

  return root;
};

const toParseInfo = (result: IParseResults, workspaceRoot: string): ParseInfo => {
  const { dir: directory, base: fileName } = parse(result.file);

  if (!result.file.startsWith(workspaceRoot)) {
    throw Error("Given file is not within workspace root.");
  }

  return directory
    .replace(workspaceRoot, "")
    .split(pathSeparator)
    .filter(p => p.length !== 0)
    .reduce(
      (previousValue, currentValue) => {
        const id = _.join([workspaceRoot, ...previousValue.folders.map(f => f.name), currentValue], pathSeparator);

        return {
          ...previousValue,
          folders: previousValue.folders.concat({
            id,
            name: currentValue,
          }),
        };
      },
      {
        fileName,
        folders: [] as Array<{ id: string; name: string }>,
        parseResult: result,
      },
    );
};

const createTree = (parseResults: IParseResults[], workspaceRoot: string): RootNode =>
  process(parseResults, workspaceRoot, createRootNode(workspaceRoot));

export { createTree };
