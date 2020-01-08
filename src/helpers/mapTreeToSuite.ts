import _ from "lodash";
import { TestInfo, TestSuiteInfo } from "vscode-test-adapter-api";
import { DescribeNode, FileNode, FolderNode, RootNode, TestNode } from "./tree";

const mapTreeToSuite = (tree: RootNode): TestSuiteInfo => ({
  children: tree.folders.map(mapFolderNodeToTestSuite).concat(tree.files.map(mapFileNodeToTestSuite)),
  id: "root",
  label: "Jest Test Adapter",
  type: "suite",
});

const mapFolderNodeToTestSuite = (folder: FolderNode): TestSuiteInfo => ({
  children: folder.folders.map(mapFolderNodeToTestSuite).concat(folder.files.map(mapFileNodeToTestSuite)),
  id: folder.id,
  label: folder.label,
  type: "suite",
});

const mapFileNodeToTestSuite = (file: FileNode): TestSuiteInfo => ({
  children: file.describeBlocks
    .map(d => mapDescribeBlockToTestSuite(d) as TestSuiteInfo | TestInfo)
    .concat(file.tests.map(mapTestToTestInfo)),
  id: file.id,
  label: file.label,
  type: "suite",
});

const mapDescribeBlockToTestSuite = (describe: DescribeNode): TestSuiteInfo => ({
  children: describe.describeBlocks
    .map(d => mapDescribeBlockToTestSuite(d) as TestInfo | TestSuiteInfo)
    .concat(describe.tests.map(mapTestToTestInfo)),
  file: describe.file,
  id: describe.id,
  label: describe.label,
  line: describe.line,
  type: "suite",
});

const mapTestToTestInfo = (test: TestNode): TestInfo => ({
  file: test.file,
  id: test.id,
  label: test.label,
  line: test.line,
  type: "test",
});

export { mapTreeToSuite };
