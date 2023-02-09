const adminTest = require('./adminTest');
const createTests = require('./createTest');
const voteTests = require('./votingTests');
const delegateTests = require('./delegateTest');




// describe('Testing for Admin Setup Function', () => {
//     adminTest();
// });

// describe('Testing for minting new NFTs', () => {
//     createTests.createStreamTest();
//     createTests.createVestTest();
// });

describe('Testing the locked token balance, and delegation of locked balances', () => {
    voteTests.streamVotingTest();
})