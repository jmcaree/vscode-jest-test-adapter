import { ProjectConfig } from '../repo';

interface NodeBase {
  id: string;
  label: string;
}

export type Node =
  | WorkspaceRootNode
  | ProjectRootNode
  | FolderNode
  | FileNode
  | FileWithParseErrorNode
  | DescribeNode
  | TestNode;

export interface WorkspaceRootNode extends NodeBase {
  id: "root";
  type: "workspaceRootNode";
  projects: ProjectRootNode[];
}

export interface ProjectRootNode extends NodeBase {
  type: "projectRootNode";
  folders: FolderNode[];
  files: Array<FileNode | FileWithParseErrorNode>;
  config: ProjectConfig;
}

export interface FolderNode extends NodeBase {
  type: "folder";
  folders: FolderNode[];
  files: Array<FileNode | FileWithParseErrorNode>;
}

export interface FileNode extends NodeBase {
  type: "file";
  describeBlocks: DescribeNode[];
  tests: TestNode[];
  file: string;
  line: number;
}

export interface FileWithParseErrorNode extends NodeBase {
  type: "fileWithParseError";
  file: string;
  error: string;
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

export const createWorkspaceRootNode = (): WorkspaceRootNode => {
  return {
    id: "root",
    label: "workspaceRootNode",
    projects: [],
    type: "workspaceRootNode",
  };
};

export const createProjectNode = (id: string, label: string, config: ProjectConfig): ProjectRootNode => {
  return {
    config,
    files: [],
    folders: [],
    id,
    label,
    type: "projectRootNode",
  };
};

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
  id,
  label,
  line: 1, // TODO confirm that we are one indexed.
  tests: [],
  type: "file",
});

export const createFileWithParseErrorNode = (
  id: string,
  label: string,
  file: string,
  error: string,
): FileWithParseErrorNode => ({
  error,
  file,
  id,
  label,
  type: "fileWithParseError",
});

export const createDescribeNode = (id: string, label: string, file: string, line: number): DescribeNode => ({
  describeBlocks: [],
  file,
  id,
  label,
  line,
  tests: [],
  type: "describe",
});

export const createTestNode = (id: string, label: string, file: string, line: number): TestNode => ({
  file,
  id,
  label,
  line,
  type: "test",
});
