import { SnapshotSerializerPlugin } from "jest";
import * as xyz from "jest-serializer-path";

declare module "jest-serializer-path" {
  const serializer: SnapshotSerializerPlugin;
  export = serializer;
}
