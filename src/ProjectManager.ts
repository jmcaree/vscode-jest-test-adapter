import { getSettings } from "jest-editor-support";
import _ from "lodash";
import vscode from "vscode";
import { Log } from "vscode-test-adapter-util";
import { initProjectWorkspace } from "./helpers/initProjectWorkspace";
import { createWorkspaceRootNode, WorkspaceRootNode } from "./helpers/tree";
import { JestTestAdapterOptions } from "./JestManager";
import { getRepoParser, RepoParser } from "./repo";
import { ProjectChangeEvent, ProjectConfig } from "./repo/types";
import TestLoader from "./TestLoader";
import {
  EnvironmentChangedEvent,
  IDisposable,
  ProjectsChangedEvent,
  ProjectTestState,
  WorkspaceTestState,
} from "./types";

class ProjectManager {
  private repoParser: RepoParser | null = null;
  private testLoaders: TestLoader[] = [];
  private disposables: IDisposable[] = [];
  private projectsChangedEmitter: vscode.EventEmitter<ProjectsChangedEvent>;
  private workspaceTestState: WorkspaceRootNode = createWorkspaceRootNode();

  constructor(
    private readonly workspace: vscode.WorkspaceFolder,
    private readonly log: Log,
    private readonly options: JestTestAdapterOptions,
  ) {
    this.projectsChangedEmitter = new vscode.EventEmitter<ProjectsChangedEvent>();
  }

  public get projectsChanged() {
    return this.projectsChangedEmitter.event;
  }

  public async getTestState(): Promise<WorkspaceTestState> {
    if (!this.repoParser) {
      this.repoParser = await getRepoParser(this.workspace.uri.fsPath, this.log);
      this.disposables.push(this.repoParser.projectChange(this.handleProjectChange));
    }
    if (!this.repoParser) {
      this.log.error("No RepoParser available.");
      return { suite: this.workspaceTestState };
    }

    const jestPath = this.options.pathToJest(this.workspace);

    // TODO do we need to force load this?
    const projects = await this.repoParser.getProjects();
    const promises = projects.map(async p => {
      const projectWorkspace = initProjectWorkspace(p.jestConfig!, jestPath, p.rootPath);

      this.log.info(`Loading Jest settings from ${projectWorkspace.pathToConfig}...`);
      const settings = await getSettings(projectWorkspace);

      if (settings.configs.length > 1) {
        this.log.info(`More than one Jest config found.`, settings);
      } else if (settings.configs[0]?.testRegex?.length > 1) {
        this.log.info(`More than one Jest test regex found.`, settings);
      }

      const testLoader = new TestLoader(settings, this.log, p);
      this.testLoaders.push(testLoader);
      this.disposables.push(testLoader.environmentChange(e => this.handleTestChange(e), this));

      return testLoader.getTestState(true);
    });

    const testStates = await Promise.all(promises);

    this.workspaceTestState = {
      id: "root",
      label: this.repoParser.type,
      projects: testStates.map(x => x.suite),
      type: "workspaceRootNode",
    };

    return { suite: this.workspaceTestState };
  }

  public dispose(): void {
    for (const disposable of this.testLoaders) {
      disposable.dispose();
    }
    this.testLoaders = [];

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];

    if (this.projectsChangedEmitter) {
      this.projectsChangedEmitter.dispose();
    }
  }

  private handleTestChange(event: EnvironmentChangedEvent) {
    switch (event.type) {
      case "App":
        // Assume that we don't need to update `this.workspaceTestState` because only App files have changed.

        this.projectsChangedEmitter.fire({
          invalidatedTestIds: event.invalidatedTestIds,
          suite: this.workspaceTestState,
          type: "projectAppUpdated",
        });
        break;

      case "Test":
        this.workspaceTestState = {
          ...this.workspaceTestState,
          projects: this.workspaceTestState.projects.map(p =>
            p.id !== event.updatedSuite.id ? p : event.updatedSuite,
          ),
        };

        this.projectsChangedEmitter.fire({
          suite: this.workspaceTestState,
          testEvent: event,
          type: "projectTestsUpdated",
        });
        break;
    }
  }

  private async handleProjectChange(event: ProjectChangeEvent) {
    const jestPath = this.options.pathToJest(this.workspace);

    switch (event.type) {
      case "added":
        const newProject = await this.convertConfig(event.config, jestPath);

        this.workspaceTestState = {
          ...this.workspaceTestState,
          projects: this.workspaceTestState.projects
            .concat(newProject.suite)
            .sort((a, b) => String.prototype.localeCompare(a.id, b.id)),
        };

        this.projectsChangedEmitter.fire({
          addedProject: newProject.suite,
          suite: this.workspaceTestState,
          type: "projectAdded",
        });
        break;

      case "removed":
        this.workspaceTestState = {
          ...this.workspaceTestState,
          projects: this.workspaceTestState.projects.filter(x => x.rootPath === event.rootPath),
        };

        this.projectsChangedEmitter.fire({
          suite: this.workspaceTestState,
          type: "projectRemoved",
        });
        break;
    }
  }

  private async convertConfig(projectConfig: ProjectConfig, jestPath: string): Promise<ProjectTestState> {
    const projectWorkspace = initProjectWorkspace(projectConfig.jestConfig!, jestPath, projectConfig.rootPath);

    this.log.info(`Loading Jest settings from ${projectWorkspace.pathToConfig}...`);
    const settings = await getSettings(projectWorkspace);

    const testLoader = new TestLoader(settings, this.log, projectConfig);
    this.testLoaders.push(testLoader);

    return testLoader.getTestState();
  }
}

export default ProjectManager;
