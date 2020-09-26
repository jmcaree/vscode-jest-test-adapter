import { WorkspaceFolder } from "vscode";
import * as vscode from "vscode";
import { Log } from "vscode-test-adapter-util";
import { ProjectRootNode } from "../helpers/tree";
import { DebugOutput } from "../JestManager";
import ProjectManager from "../ProjectManager";
import {
  // @ts-ignore
  __addProject,
  // @ts-ignore
  __removeProject,
  // @ts-ignore
  __setProjects,
  getRepoParser,
  ProjectConfig,
  RepoParser,
} from "../repo";
import { ProjectChangeEvent } from "../repo/types";
import TestLoader, {
  // @ts-ignore
  __setSuite,
} from "../TestLoader";
import {
  ApplicationChangedEvent,
  EnvironmentChangedEvent,
  ProjectsChangedEvent,
  ProjectTestsChangedEvent,
} from "../types";

jest.mock("../repo");
jest.mock("../TestLoader");
jest.mock("../JestSettings");

// @ts-ignore we only need these properties mocked.
const log = {
  error: jest.fn(),
  info: jest.fn(),
} as Log;

const options = {
  debugOutput: DebugOutput.externalTerminal,
  pathToConfig: jest.fn().mockImplementation(() => ""),
  pathToJest: jest.fn().mockImplementation(() => ""),
};

const workspace: WorkspaceFolder = {
  index: 0,
  name: "test",
  // @ts-ignore
  uri: {
    fsPath: "c:\\", // TODO this may not be a valid value on all OSes.
  },
};

describe("ProjectManager tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test(`Given a ProjectManager instance
        when getTestState is called multiple times
        then single RepoParser is created and single TestLoader is created per project`, async () => {
    setupProject();

    const pm = new ProjectManager(workspace, log, options);

    await pm.getTestState();
    await pm.getTestState();
    await pm.getTestState();

    expect(getRepoParser).toHaveBeenCalledTimes(1);
    const repoParser = await getParser();
    expect(repoParser.getProjects).toHaveBeenCalledTimes(1);
    expect(TestLoader).toHaveBeenCalledTimes(1);
  });

  test(`Given a ProjectManager instance
        when the instance is disposed 
        then all internal references are disposed`, async () => {
    setupProject();
    const pm = new ProjectManager(workspace, log, options);
    // we call getTestState to make sure that it is initialised.
    await pm.getTestState();

    pm.dispose();

    // test loaders should be disposed.
    const testLoaderClass = TestLoader as jest.MockedClass<typeof TestLoader>;
    const testLoaders = testLoaderClass.mock.results.map(x => x.value as TestLoader);
    testLoaders.forEach(x => expect(x.dispose).toHaveBeenCalledTimes(1));

    // check testLoader environmentChange registrations are disposed.
    testLoaders.forEach(loader => {
      const subscriptions = loader.environmentChange as jest.MockedFunction<vscode.Event<EnvironmentChangedEvent>>;
      subscriptions.mock.results
        .map(x => x.value as vscode.Disposable)
        .forEach(x => expect(x.dispose).toHaveBeenCalledTimes(1));
    });

    // projects changed emitter should be disposed.
    expect((pm as any).projectsChangedEmitter.dispose).toHaveBeenCalledTimes(1);

    // check repo parser projectChange registrations are disposed.
    const repoParser = await getParser();
    const projectChangeCalls = repoParser.projectChange as jest.MockedFunction<vscode.Event<ProjectChangeEvent>>;
    const projectChangedSubscriptions = projectChangeCalls.mock.results.map(x => x.value as vscode.Disposable);
    projectChangedSubscriptions.forEach(x => expect(x.dispose).toHaveBeenCalledTimes(1));
  });

  test(`Given a ProjectManager instance
        when a project test file changes
        then a projectTestsUpdated event is raised`, async () => {
    setupProject();
    const pm = new ProjectManager(workspace, log, options);
    await pm.getTestState(); // this ensures registration has occurred.
    const callback = jest.fn<void, [ProjectsChangedEvent]>();
    pm.projectsChanged(callback);

    // raise an event for a test file changing.
    const testLoader = (pm as any).testLoaders[0];
    testLoader.fireEvent({
      addedTestFiles: [],
      invalidatedTestIds: [],
      modifiedTestFiles: [],
      removedTestFiles: [],
      testFiles: [],
      type: "Test",
      updatedSuite: {
        config: {
          jestCommand: "",
          jestExecutionDirectory: "",
          projectName: "",
          rootPath: "",
        },
        files: [],
        folders: [],
        id: "",
        label: "",
        type: "projectRootNode",
      },
    } as ProjectTestsChangedEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].type).toBe("projectTestsUpdated");
  });

  test(`Given a ProjectManager instance
        when a new project is added
        then then a projectAdded event is raised`, async () => {
    setupProject();
    const pm = new ProjectManager(workspace, log, options);
    await pm.getTestState(); // this ensures registration has occurred.
    const callback = jest.fn();
    pm.projectsChanged(callback);

    await addSecondProject();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].type).toBe("projectAdded");
  });

  test(`Given a ProjectManager instance and a new project is added
        when a project test file changes in the new project
        then then a projectTestsUpdated event is raised`, async () => {
    setupProject();
    const pm = new ProjectManager(workspace, log, options);
    await pm.getTestState(); // this ensures registration has occurred.
    const callback = jest.fn();
    pm.projectsChanged(callback);

    await addSecondProject();

    // raise an event for a test file changing.
    const testLoader = (pm as any).testLoaders[0];
    testLoader.fireEvent({
      addedTestFiles: [],
      invalidatedTestIds: [],
      modifiedTestFiles: [],
      removedTestFiles: [],
      testFiles: [],
      type: "Test",
      updatedSuite: {
        config: {
          jestCommand: "",
          jestExecutionDirectory: "",
          projectName: "",
          rootPath: "",
        },
        files: [],
        folders: [],
        id: "",
        label: "",
        type: "projectRootNode",
      },
    } as ProjectTestsChangedEvent);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[1][0].type).toBe("projectTestsUpdated");
  });

  test(`Given a ProjectManager instance
        when a project app file changes
        then a projectAppUpdated event is raised`, async () => {
    setupProject();
    const pm = new ProjectManager(workspace, log, options);
    await pm.getTestState(); // this ensures registration has occurred.
    const callback = jest.fn<void, [ProjectsChangedEvent]>();
    pm.projectsChanged(callback);

    // raise an event for a test file changing.
    const testLoader = (pm as any).testLoaders[0];
    testLoader.fireEvent({
      invalidatedTestIds: ["root"],
      type: "App",
    } as ApplicationChangedEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].type).toBe("projectAppUpdated");
  });

  test(`Given a ProjectManager instance and a new project is added
        when a project app file changes
        then then a projectAppUpdated event is raised`, async () => {
    setupProject();
    const pm = new ProjectManager(workspace, log, options);
    await pm.getTestState(); // this ensures registration has occurred.
    const callback = jest.fn();
    pm.projectsChanged(callback);

    await addSecondProject();

    // raise an event for a test file changing.
    const testLoader = (pm as any).testLoaders[0];
    testLoader.fireEvent({
      invalidatedTestIds: ["root"],
      type: "App",
    } as ApplicationChangedEvent);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[1][0].type).toBe("projectAppUpdated");
  });

  test(`Given a Project Manager isntance
        when a project is removed
        then a projectRemoved event is raised`, async () => {
    setupProject();
    const pm = new ProjectManager(workspace, log, options);
    await pm.getTestState(); // this ensures registration has occurred.
    const callback = jest.fn();
    pm.projectsChanged(callback);

    await removeProject("/path0");

    // assert that the callback has been called
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].type).toBe("projectRemoved");
  });
});

const getParser = async (): Promise<RepoParser> => {
  // @ts-ignore we don't need to supply any arguments since this is a mock anyway.
  const repoParser = await getRepoParser();
  return repoParser as RepoParser;
};

const setupProject = () => {
  const projectConfig = {
    jestCommand: "",
    jestConfig: "",
    jestExecutionDirectory: "",
    projectName: "mock project",
    rootPath: "/path0",
    tsConfig: "",
  };
  __setProjects([projectConfig]);

  const suite: ProjectRootNode = {
    config: projectConfig,
    files: [],
    folders: [],
    id: "my suite",
    label: "my suite",
    type: "projectRootNode",
  };
  __setSuite(suite);
};

const addSecondProject = async () => {
  const addedProject: ProjectConfig = {
    jestCommand: "",
    jestConfig: "",
    jestExecutionDirectory: "",
    projectName: "added mock project",
    rootPath: "/path1",
    tsConfig: "",
  };

  __addProject(addedProject);

  await new Promise(r => setTimeout(r, 1));
};

const removeProject = async (projectPath: string) => {
  __removeProject(projectPath);

  await new Promise(r => setTimeout(r, 1));
};
