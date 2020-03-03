interface NodeBase {
  id: string;
  label: string;
}

export type Node = WorkspaceRootNode | ProjectRootNode | FolderNode | FileNode | DescribeNode | TestNode;

export interface WorkspaceRootNode extends NodeBase {
  type: "workspaceRootNode";
  projects: ProjectRootNode[];
}

export interface ProjectRootNode extends NodeBase {
  type: "projectRootNode";
  folders: FolderNode[];
  files: FileNode[];
  rootPath: string;
}

export interface FolderNode extends NodeBase {
  type: "folder";
  folders: FolderNode[];
  files: FileNode[];
}

export interface FileNode extends NodeBase {
  type: "file";
  describeBlocks: DescribeNode[];
  tests: TestNode[];
  file: string;
  line: number;
}

export interface DescribeNode extends NodeBase {
  describeBlocks: DescribeNode[];
  type: "describe";
  tests: TestNode[];
  file: string;
  line: number;
}

export interface TestNode extends NodeBase {
  type: "test";
  file: string;
  line: number;
}

export interface NodeVisitor {
  visitWorkspaceRootNode: (workspaceRoot: WorkspaceRootNode) => void;

  visitProjectRootNode: (projectRoot: ProjectRootNode) => void;

  visitFolderNode: (folder: FolderNode) => void;

  visitFileNode: (file: FileNode) => void;

  visitDescribeNode: (describe: DescribeNode) => void;

  visitTestNode: (test: TestNode) => void;
}

export const createWorkspaceRootNode = (id: string): WorkspaceRootNode => {
  return {
    id,
    label: "workspaceRootNode",
    projects: [],
    type: "workspaceRootNode"
  }
}

export const createProjectNode = (id: string, label: string, rootPath: string): ProjectRootNode => {
  return {
    files: [],
    folders: [],
    id,
    label,
    rootPath,
    type: "projectRootNode",
  }
}

export const createFolderNode = (id: string, label: string): FolderNode => ({
  files: [],
  folders: [],
  id,
  label,
  type: "folder",
});

export const createFileNode = (id: string, label: string, file: string): FileNode => ({
  describeBlocks: [],
  file,
  line: 1, // TODO confirm that we are one indexed.
  id,
  label,
  tests: [],
  type: "file",
});

export const createDescribeNode = (id: string, label: string, file: string, line: number): DescribeNode => ({
  describeBlocks: [],
  file,
  line,
  id,
  label,
  tests: [],
  type: "describe",
});

export const createTestNode = (id: string, label: string, file: string, line: number): TestNode => ({
  file,
  line,
  id,
  label,
  type: "test",
});
