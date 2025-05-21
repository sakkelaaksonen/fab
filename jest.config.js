module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['./jest.setup.js'],
    moduleNameMapper: {
        '^mustache$': '<rootDir>/__mocks__/mustache.js'
    }
}; 