import { DescribeNode, FileNode, FolderNode, ProjectRootNode, TestNode, WorkspaceRootNode } from "./tree";

function filterTree(tree: WorkspaceRootNode, testNames: string[]): WorkspaceRootNode;
function filterTree(tree: ProjectRootNode, testNames: string[]): ProjectRootNode;
function filterTree(
  tree: WorkspaceRootNode | ProjectRootNode,
  testNames: string[],
): WorkspaceRootNode | ProjectRootNode {
  if (testNames.length === 1 && testNames[0] === "root") {
    return tree;
  }

  switch (tree.type) {
    case "workspaceRootNode":
      return filterWorkspace(tree as WorkspaceRootNode, testNames);

    case "projectRootNode":
      return filterProject(tree as ProjectRootNode, testNames);
  }
}

const filterWorkspace = (tree: WorkspaceRootNode, testNames: string[]): WorkspaceRootNode => {
  return {
    ...tree,
    projects: tree.projects.map(p => filterProject(p, testNames)),
  };
};

const filterProject = (project: ProjectRootNode, testNames: string[]): ProjectRootNode => {
  return {
    ...project,
    files: filterFiles(project.files, testNames),
    folders: filterFolders(project.folders, testNames),
  };
};

const filterFolders = (folders: FolderNode[], testNames: string[]): FolderNode[] => {
  return folders
    .filter(f => testNames.some(t => t.startsWith(f.id)))
    .map(f => {
      if (testNames.some(t => t === f.id)) {
        return f;
      }
      return { ...f, folders: filterFolders(f.folders, testNames), files: filterFiles(f.files, testNames) };
    });
};

const filterFiles = (files: FileNode[], testNames: string[]): FileNode[] => {
  return files
    .filter(f => testNames.some(t => t.startsWith(f.id)))
    .map(f => {
      if (testNames.some(t => t === f.id)) {
        return f;
      }
      return {
        ...f,
        describeBlocks: filterDescribeBlocks(f.describeBlocks, testNames),
        tests: filterTests(f.tests, testNames),
      };
    });
};

const filterDescribeBlocks = (describeBlocks: DescribeNode[], testNames: string[]): DescribeNode[] => {
  return describeBlocks
    .filter(f => testNames.some(t => t.startsWith(f.id)))
    .map(f => {
      if (testNames.some(t => t === f.id)) {
        return f;
      }
      return { ...f, tests: filterTests(f.tests, testNames) };
    });
};

const filterTests = (tests: TestNode[], testNames: string[]): TestNode[] => {
  return tests.filter(f => testNames.some(t => t.startsWith(f.id)));
};

export { filterTree };
