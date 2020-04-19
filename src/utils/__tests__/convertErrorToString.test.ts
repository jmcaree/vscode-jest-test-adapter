// TODO figure out how to get ts-jest to see the type declaration file...
// @ts-ignore
import serializer from "jest-serializer-path";
import { convertErrorToString } from "..";

beforeAll(() => expect.addSnapshotSerializer(serializer));

test("Snapshot test 'convertErrorToString'", () => {
  const errorAsString = convertErrorToString(new SyntaxError("you made a boo boo."));
  expect(errorAsString).toMatchInlineSnapshot(`
    "SyntaxError: you made a boo boo.
        at Object.<anonymous> (<PROJECT_ROOT>/src/utils/__tests__/convertErrorToString.test.ts:9:46)
        at Object.asyncJestTest (<PROJECT_ROOT>/node_modules/[4mjest-jasmine2[24m/build/jasmineAsyncInstall.js:100:37)
        at <PROJECT_ROOT>/node_modules/[4mjest-jasmine2[24m/build/queueRunner.js:45:12
        at new Promise (<anonymous>)
        at mapper (<PROJECT_ROOT>/node_modules/[4mjest-jasmine2[24m/build/queueRunner.js:28:19)
        at <PROJECT_ROOT>/node_modules/[4mjest-jasmine2[24m/build/queueRunner.js:75:41
    [90m    at processTicksAndRejections (internal/process/task_queues.js:93:5)[39m"
  `);
});
