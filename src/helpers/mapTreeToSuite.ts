import _ from "lodash";
import vscode from "vscode";
import { TestInfo, TestSuiteInfo } from "vscode-test-adapter-api";
import { EXTENSION_CONFIGURATION_NAME } from "../constants";
import { DescribeNode, FileNode, FolderNode, ProjectRootNode, TestNode, WorkspaceRootNode } from "./tree";

const mapWorkspaceRootToSuite = (rootNode: WorkspaceRootNode): TestSuiteInfo | undefined => {
  let projects: ProjectRootNode[];
  if (shouldHideEmptyProjects()) {
    projects = rootNode.projects.filter((p) => p.files.length > 0 || _.some(p.folders, (f) => folderHasFiles(f)));
  } else {
    projects = rootNode.projects;
  }

  // if there are no projects in the workspace then return undefined.  This will not display anything in test exporer.
  // this can happen either because we've filtered out all projects with no tests or because the workspace doesn't have
  // a recognised project at all.
  if (projects.length === 0) {
    return undefined;
  }
  // if there is only one project, then we reduce the nesting and return just the project suite.
  if (projects.length === 1) {
    return mapProjectRootNodeToSuite(projects[0]);
  }
  // otherwise we transform everything.
  return {
    children: projects.map(mapProjectRootNodeToSuite),
    id: rootNode.id,
    label: rootNode.label,
    type: "suite",
  };
};

const shouldHideEmptyProjects = () =>
  vscode.workspace.getConfiguration(EXTENSION_CONFIGURATION_NAME, null).get<boolean>("hideEmptyProjects") ?? true;

const folderHasFiles = (folder: FolderNode): boolean =>
  folder.files.length > 0 || _.some(folder.folders, (f) => folderHasFiles(f));

const mapProjectRootNodeToSuite = ({ label, id, files, folders }: ProjectRootNode): TestSuiteInfo => ({
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
    .map((d) => mapDescribeBlockToTestSuite(d) as TestSuiteInfo | TestInfo)
    .concat(file.tests.map(mapTestToTestInfo)),
  id: file.id,
  label: file.label,
  type: "suite",
});

const mapDescribeBlockToTestSuite = (describe: DescribeNode): TestSuiteInfo => ({
  children: describe.describeBlocks
    .map((d) => mapDescribeBlockToTestSuite(d) as TestInfo | TestSuiteInfo)
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
