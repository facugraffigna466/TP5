module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  collectCoverageFrom: [
    'server.js',
    '!tests/**',
    '!node_modules/**'
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
  verbose: true
};

