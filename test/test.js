const adminTest = require('./tests/adminTest');
const createTests = require('./tests/createTest');
const voteTests = require('./tests/votingTests');
const batchTests = require('./tests/batchingTest');
const happyPath = require('./tests/happyPath');

const C = require('./constants');
const { BigNumber } = require('ethers');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

// describe('Testing for Admin Setup Function', () => {
//     adminTest(true, false);
//     adminTest(false, true);
//     adminTest(false, false);
// });

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

// describe('Testing the Batch Minter contracts', () => {
//   const amountParamsMatrix = [
//     { amounts: [C.E18_1, C.E18_10, C.E18_1], rates: [C.E18_05, C.E18_1, C.E18_1] },
//     { amounts: [C.E18_10, C.E18_12, C.E18_13], rates: [C.E18_05, C.E18_10, C.E18_1] },
//     { amounts: [C.E18_100, C.E18_10, C.E18_1], rates: [C.E18_100, C.E18_1, C.E18_1] },
//     { amounts: [C.randomBigNum(18, 100), C.randomBigNum(18, 100), C.randomBigNum(18, 100)], rates: [C.E18_05, C.E18_1, C.E18_1] },
//     { amounts: [C.randomBigNum(18, 100), C.randomBigNum(18, 100), C.randomBigNum(18, 100)], rates: [C.E18_05, C.E18_1, C.E18_1] },
//     { amounts: [C.randomBigNum(18, 100), C.randomBigNum(18, 100), C.randomBigNum(18, 100)], rates: [C.E18_05, C.E18_1, C.E18_1] },
//   ];
//   const timeParamsMatrix = [
//     { starts: [0, 1, -10], cliffs: [0, 5, 10], unlocks: [0, 3, -5] },
//     { starts: [-50, -100, -200], cliffs: [-50, -50, -50], unlocks: [-25, 0, -50] },
//     { starts: [50, 100, 200], cliffs: [75, 150, 500], unlocks: [100, 200, 1000] },
//   ];
//   amountParamsMatrix.forEach((amountParam) => {
//     timeParamsMatrix.forEach((timeParam) => {
//       batchTests(true, false, amountParam, timeParam);
//       batchTests(false, true, amountParam, timeParam);
//       batchTests(false, false, amountParam, timeParam);
//     });
//   });
// });

// describe('Testing for minting new NFTs', () => {
//     createTests.createStreamTest();
//     createTests.createVestTest();
// });

describe('Testing the locked token balance, and delegation of locked balances', () => {
    voteTests.streamVotingTest();
})
