import type {Config} from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    transform: {"^.+\\.(ts|tsx)$": "ts-jest"},
    extensionsToTreatAsEsm: ['.ts'],
};

export default config;
