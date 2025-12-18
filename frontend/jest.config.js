const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/pages/_app.js',
    '!src/pages/_document.js',
    '!src/lib/**/*',
  ],
  coverageReporters: ['text', 'html'],
}

module.exports = createJestConfig(customJestConfig)
