module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    // '^.+\\.(ts|js|tsx)$': 'ts-jest',
  },
  testRegex: 'src/.*.spec.ts', // test filenames matching this regex
  moduleFileExtensions: ['ts', 'js'], // modules are only in .ts files, but 'js' *must* be specified too
  transformIgnorePatterns: [
    'node_modules/.*',
    // 'node_modules/(?!(.*\/@asleeppiano\/markdown-it-frontmatter)/)',
  ],
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
