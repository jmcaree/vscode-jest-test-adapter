module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ["jest-extended"],
  testEnvironment: 'node',
  testRegex: "(/__tests__/.*\\.test|(\\.|/)(test|spec))\\.[jt]sx?$",
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname"
  ]
};