const adminTest = require('./adminTest');
const createTests = require('./createTest');
const voteTests = require('./votingTests');
const happyPath = require('./happyPath');

const C = require('./constants');
const { BigNumber } = require('ethers');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

// describe('Testing for Admin Setup Function', () => {
//     adminTest();
// });

// describe('Testing for minting new NFTs', () => {
//     createTests.createStreamTest();
//     createTests.createVestTest();
// });

// describe('Testing the locked token balance, and delegation of locked balances', () => {
//     voteTests.streamVotingTest();
// })

describe('Testing for the happy Path', () => {
  const amountParamsMatrix = [{ amount: C.E18_1, rate: C.E18_05 }, { amount: C.E18_10, rate: C.E18_1 }];
  const timeParamsMatrix = [{ startShift: 0, cliffShift: 0, unlockShift: 0, timeShift: 5 }, { startShift: 0, cliffShift: 0, unlockShift: 0, timeShift: 2 }];
  amountParamsMatrix.forEach((amountParam) => {
    timeParamsMatrix.forEach((timeParam) => {
      happyPath(true, false, amountParam, timeParam);
      happyPath(false, true, amountParam, timeParam);
      happyPath(false, false, amountParam, timeParam);
    });
  });
});
