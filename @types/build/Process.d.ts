declare module "jest-editor-support/build/Process" {
  export function createProcess(
    workspace: ProjectWorkspace,
    args: string[],
    options?: SpawnOptions,
  );
}
