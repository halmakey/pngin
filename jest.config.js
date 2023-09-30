/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "<rootDir>/jest.setup.ts",
  transform: {
    "^.+\\.[jt]sx?$": "ts-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!(nanoid)/)"],
  moduleNameMapper: {
    "^@/(.+)": "<rootDir>/$1",
  },
};
