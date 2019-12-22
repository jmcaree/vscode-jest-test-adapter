import { DescribeNode, FileNode, FolderNode, RootNode, TestNode } from "./tree";

const filterTree = (tree: RootNode, testNames: string[]): RootNode => {
  if (testNames.length === 1 && testNames[0] === "root") {
    return tree;
  }
  return {
    ...tree,
    files: filterFiles(tree.files, testNames),
    folders: filterFolders(tree.folders, testNames),
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
