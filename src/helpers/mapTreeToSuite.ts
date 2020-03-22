import _ from "lodash";
import { TestInfo, TestSuiteInfo } from "vscode-test-adapter-api";
import { DescribeNode, FileNode, FolderNode, ProjectRootNode, TestNode, WorkspaceRootNode } from "./tree";

const mapWorkspaceRootToSuite = ({ label, id, projects }: WorkspaceRootNode): TestSuiteInfo => ({
  children: projects.map(mapProjectRootNodeToSuite),
  id,
  label,
  type: "suite",
});

const mapProjectRootNodeToSuite = ({label, id, files, folders}: ProjectRootNode): TestSuiteInfo => ({
  children: folders.map(mapFolderNodeToTestSuite).concat(files.map(mapFileNodeToTestSuite)),
  id,
  label,
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

export { mapWorkspaceRootToSuite };
