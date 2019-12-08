import { IParseResults } from 'jest-editor-support';

export interface Node {
    id: string;
}

export interface RootNode extends Node {
    type: "root";
    id: "root";
    children: Array<Folder | File>;
}

export interface Folder extends Node {
    type: "folder";
    id: string;
    children: Array<Folder | File>;
    parent: Folder | RootNode;
}

export interface File extends Node {
    type: "file";
    id: string;
    children: IParseResults[];
    parent: Folder | RootNode;
}

export interface Describe extends Node {
    type: "describe";
    id: string;
}

export interface Test extends Node {
    type: "test";
    id: string;
}
