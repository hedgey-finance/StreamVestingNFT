const adminTest = require('./tests/adminTest');
const createTests = require('./tests/createTest');
const voteTests = require('./tests/votingTests');
const happyPath = require('./tests/happyPath');

const C = require('./constants');
const { BigNumber } = require('ethers');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('Testing for Admin Setup Function', () => {
    adminTest(true, false);
    adminTest(false, true);
    adminTest(false, false);
});

// describe('Testing for minting new NFTs', () => {
//     createTests.createStreamTest();
//     createTests.createVestTest();
// });

// describe('Testing the locked token balance, and delegation of locked balances', () => {
//     voteTests.streamVotingTest();
// })

// describe('Testing for the happy Path', () => {
//   const amountParamsMatrix = [
//     { amount: C.E18_1, rate: C.E18_05 },
//     { amount: C.E18_10, rate: C.E18_05 },
//     { amount: C.E18_100, rate: C.E18_1 },
//     { amount: C.E18_50, rate: C.E18_1 },
//     { amount: C.E18_12, rate: C.E18_1 },
//     { amount: C.E18_12, rate: C.E18_05 },
//     { amount: C.E18_13, rate: C.E18_3 },
//     { amount: C.randomBigNum(18, 100), rate: C.E18_1 },
//     { amount: C.randomBigNum(18, 100), rate: C.E18_1 },
//     { amount: C.randomBigNum(18, 100), rate: C.E18_3 },
//   ];
//   const timeParamsMatrix = [
//     { startShift: 0, cliffShift: 0, timeShift: 2 },
//     { startShift: 0, cliffShift: 0, timeShift: 2 },
//     { startShift: 0, cliffShift: 2, timeShift: 3 },
//     { startShift: 0, cliffShift: 5, timeShift: 5 },
//     { startShift: 0, cliffShift: 0, timeShift: 10 },
//   ];
//   amountParamsMatrix.forEach((amountParam) => {
//     timeParamsMatrix.forEach((timeParam) => {
//       happyPath(true, false, amountParam, timeParam);
//       happyPath(false, true, amountParam, timeParam);
//       happyPath(false, false, amountParam, timeParam);
//     });
//   });
// });
