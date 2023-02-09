const adminTest = require('./adminTest');
const createTests = require('./createTest');




describe('Testing for Admin Setup Function', () => {
    adminTest();
});

describe('Testing for minting new NFTs', () => {
    createTests.createStreamTest();
    createTests.createVestTest();
});