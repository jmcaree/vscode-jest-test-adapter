import { DescribeNode, FileNode, FolderNode, ProjectRootNode, TestNode, WorkspaceRootNode } from "./tree";

const filterTree = (tree: WorkspaceRootNode, testNames: string[]): WorkspaceRootNode => {
  if (testNames.length === 1 && testNames[0] === "root") {
    return tree;
  }
  return {
    ...tree,
    projects: filterProjects(tree.projects, testNames),
  };
};

const filterProjects = (projects: ProjectRootNode[], testNames: string[]): ProjectRootNode[] => {
  return projects
    .filter(p => true)  // TODO this filter needs to be implemented correctly.
    .map(p => ({ ...p, files: filterFiles(p.files, testNames), folders: filterFolders(p.folders, testNames) }));
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
