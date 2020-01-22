import { FolderNode, RootNode } from "./tree";

const deleteFileFromTree = (tree: RootNode, fileToDelete: string): RootNode =>
  deleteFileFromRootOrFolder(tree, fileToDelete);

const deleteFileFromRootOrFolder = <T extends FolderNode | RootNode>(folder: T, fileToDelete: string): T => {
  const files = folder.files.filter(f => f.file !== fileToDelete);

  // map recursively the current folders.  We also exclude any folders without files or child folders.
  const folders = folder.folders
    .map(f => deleteFileFromRootOrFolder(f, fileToDelete))
    .filter(f => f.files.length !== 0 || f.folders.length !== 0);

  return { ...folder, files, folders };
};

export { deleteFileFromTree as default };
