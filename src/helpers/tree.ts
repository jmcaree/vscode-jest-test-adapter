export interface Node {
  id: string;
  label: string;
  acceptVisitor: (visitor: NodeVisitor) => void;
}

export interface RootNode extends Node {
  type: "root";
  folders: FolderNode[];
  files: FileNode[];
}

export interface FolderNode extends Node {
  type: "folder";
  folders: FolderNode[];
  files: FileNode[];
}

export interface FileNode extends Node {
  type: "file";
  describeBlocks: DescribeNode[];
  tests: TestNode[];
  file: string;
  line: number;
}

export interface DescribeNode extends Node {
  type: "describe";
  tests: TestNode[];
  file: string;
  line: number;
}

export interface TestNode extends Node {
  type: "test";
  file: string;
  line: number;
}

export interface NodeVisitor {
  visitRootNode: (root: RootNode) => void;

  visitFolderNode: (folder: FolderNode) => void;

  visitFileNode: (file: FileNode) => void;

  visitDescribeNode: (describe: DescribeNode) => void;

  visitTestNode: (test: TestNode) => void;
}

export const createRootNode = (id: string): RootNode => {
  return {
    acceptVisitor(visitor) {
      visitor.visitRootNode(this);
    },
    files: [],
    folders: [],
    id,
    label: "root",
    type: "root",
  };
};

export const createFolderNode = (id: string, label: string): FolderNode => ({
  acceptVisitor(visitor) {
    visitor.visitFolderNode(this);
  },
  files: [],
  folders: [],
  id,
  label,
  type: "folder",
});

export const createFileNode = (id: string, label: string, file: string): FileNode => ({
  acceptVisitor(visitor) {
    visitor.visitFileNode(this);
  },
  describeBlocks: [],
  file,
  line: 1,  // TODO confirm that we are one indexed.
  id,
  label,
  tests: [],
  type: "file",
});

export const createDescribeNode = (id: string, label: string, file: string, line: number): DescribeNode => ({
  acceptVisitor(visitor) {
    visitor.visitDescribeNode(this);
  },
  file,
  line,
  id,
  label,
  tests: [],
  type: "describe",
});

export const createTestNode = (id: string, label: string, file: string, line: number): TestNode => ({
  acceptVisitor(visitor) {
    visitor.visitTestNode(this);
  },
  file,
  line,
  id,
  label,
  type: "test",
});
