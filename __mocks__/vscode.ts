import { Disposable, EventEmitter } from "vscode";

const languages = {
  createDiagnosticCollection: jest.fn(),
};

const StatusBarAlignment = {};

const workspace = {
  getConfiguration: jest.fn(),
  onDidSaveTextDocument: jest.fn(),
  workspaceFolders: [],
};

const OverviewRulerLane = {
  Left: null,
};

const Uri = {
  file: (f: any) => f,
  parse: jest.fn(),
};

const Diagnostic = jest.fn();
const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 };

const debug = {
  onDidTerminateDebugSession: jest.fn(),
  startDebugging: jest.fn(),
};

const commands = {
  executeCommand: jest.fn(),
};

const CancellationTokenSource = jest.fn().mockImplementation(() => ({
  token: {},
}));

function eventEmitter<T>(): EventEmitter<T> {
  const subscribers: Array<(e: T) => any> = [];

  return {
    dispose: jest.fn(() => {}),
    event: jest.fn((listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]) => {
      subscribers.push(listener);
      return {
        dispose: jest.fn(() => {}),
      };
    }),
    fire: (data: T) => {
      subscribers.forEach(s => s(data));
    },
  };
}

const EventEmitterImpl = jest.fn(eventEmitter);

module.exports = {
  CancellationTokenSource,
  Diagnostic,
  DiagnosticSeverity,
  EventEmitter: EventEmitterImpl,
  OverviewRulerLane,
  // Range,
  StatusBarAlignment,
  Uri,
  commands,
  debug,
  languages,
  // window,
  workspace,
};
