const adminTest = require('./tests/adminTest');
const happyPath = require('./tests/happyPath');
const { createTests, createErrorTests } = require('./tests/createTest');
const { batchTests, batchErrorTests } = require('./tests/batchingTest');
const { redeemTest, reedeemMulitpleTest, redeemAllTest, transferAndRedeemTest, redeemErrorTests } = require('./tests/redeeming');

const { delegateTests } = require('./tests/delegateTests');

const C = require('./constants');

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
//     { amount: C.randomBigNum(18, 100, 1), rate: C.E18_1 },
//     { amount: C.randomBigNum(18, 100, 2), rate: C.randomBigNum(6, 2, 1) },
//     { amount: C.randomBigNum(6, 100, 5), rate: C.randomBigNum(6, 5, 1) },
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
//       happyPath(true, true, false, amountParam, timeParam);
//       happyPath(true, false, false, amountParam, timeParam);
//       happyPath(false, false, true, amountParam, timeParam);
//       happyPath(false, false, false, amountParam, timeParam);
//     });
//   });
// });

// describe('Testin the primary Create NFT functions with various params', () => {
//   const amountParamsMatrix = [
//     { amount: C.E18_10, rate: C.E18_1 },
//     { amount: C.E18_1, rate: C.E18_1 },
//     { amount: C.E18_100, rate: C.E18_1 },
//     { amount: C.E18_1000, rate: C.E18_13 },
//     { amount: C.randomBigNum(18, 10000, 50), rate: C.randomBigNum(18, 50, 1) },
//     { amount: C.randomBigNum(18, 100, 4), rate: C.randomBigNum(17, 40, 3) },
//     { amount: C.randomBigNum(18, 200, 30), rate: C.randomBigNum(16, 30, 1) },
//     { amount: C.randomBigNum(18, 10000, 50), rate: C.randomBigNum(15, 50, 1) },
//     { amount: C.randomBigNum(12, 100, 5), rate: C.randomBigNum(12, 5, 1) },
//     { amount: C.randomBigNum(13, 1000, 50), rate: C.randomBigNum(12, 50, 1) },
//     { amount: C.randomBigNum(6, 100, 10), rate: C.randomBigNum(6, 10, 3) },
//   ];
//   const timeParamsMatrix = [
//     { startShift: 0, cliffShift: 0, unlockShift: 0, transferLock: true, timeShift: 5 },
//     { startShift: 0, cliffShift: 15, unlockShift: 10, transferLock: true, timeShift: 5 },
//     { startShift: 10, cliffShift: 0, unlockShift: 0, transferLock: true, timeShift: 5 },
//     { startShift: 10, cliffShift: 15, unlockShift: 12, transferLock: true, timeShift: 11 },
//     { startShift: -10, cliffShift: 0, unlockShift: 5, transferLock: true, timeShift: 1 },
//     { startShift: -50, cliffShift: -25, unlockShift: -50, transferLock: true, timeShift: 1 },
//     { startShift: -5, cliffShift: -5, unlockShift: 0, transferLock: true, timeShift: 5 },
//     { startShift: -10, cliffShift: -10, unlockShift: 0, transferLock: true, timeShift: 5 }
//   ];
//   amountParamsMatrix.forEach((amountParam) => {
//     timeParamsMatrix.forEach((timeParam) => {
//       createTests(true, true, false, amountParam, timeParam);
//       createTests(true, false, false, amountParam, timeParam);
//       createTests(false, false, false, amountParam, timeParam);
//       createTests(false, false, true, amountParam, timeParam);
//     });
//   });
//   createErrorTests(true, true, false);
//   createErrorTests(true, false, false);
//   createErrorTests(false, false, false);
//   createErrorTests(false, false, true);
// });

// describe('Testing the Batch Minter contracts', () => {
//   const amountParamsMatrix = [
//     { amounts: [C.E18_1, C.E18_10, C.E18_1], rates: [C.E18_05, C.E18_1, C.E18_1] },
//     { amounts: [C.E18_10, C.E18_12, C.E18_13], rates: [C.E18_05, C.E18_10, C.E18_1] },
//     { amounts: [C.E18_100, C.E18_10, C.E18_1], rates: [C.E18_100, C.E18_1, C.E18_1] },
//     { amounts: [C.randomBigNum(18, 100, 2), C.randomBigNum(18, 100, 4), C.randomBigNum(18, 100, 5)], rates: [C.E18_05, C.E18_1, C.E18_1] },
//     { amounts: [C.randomBigNum(18, 100, 1), C.randomBigNum(18, 100, 12), C.randomBigNum(18, 100, 17)], rates: [C.E18_05, C.E18_1, C.E18_1] },
//     { amounts: [C.randomBigNum(6, 100, 10), C.randomBigNum(6, 100, 12), C.randomBigNum(7, 100, 11)], rates: [C.E6_10, C.E6_10, C.E6_10] },
//   ];
//   const timeParamsMatrix = [
//     { starts: [0, 1, -10], cliffs: [0, 5, 10], unlocks: [0, 3, -5] },
//     { starts: [-50, -100, -200], cliffs: [-50, -50, -50], unlocks: [-25, 0, -50] },
//     { starts: [50, 100, 200], cliffs: [75, 150, 500], unlocks: [100, 200, 1000] },
//   ];
//   amountParamsMatrix.forEach((amountParam) => {
//     timeParamsMatrix.forEach((timeParam) => {
//       batchTests(true, true, false, amountParam, timeParam);
//       batchTests(true, false, false, amountParam, timeParam);
//       batchTests(false, false, true, amountParam, timeParam);
//       batchTests(false, false, false, amountParam, timeParam);
//     });
//   });
//   batchErrorTests(true, true, false);
//   batchErrorTests(true, false, false);
//   batchErrorTests(false, false, true);
//   batchErrorTests(false, false, false);
// });

describe(`Testing the Redemption of NFTs`, () => {
  const amountParamsMatrix = [
    { amounts: [C.E18_1, C.E18_10, C.E18_1, C.E18_1], rates: [C.E18_05, C.E18_1, C.E18_1, C.E18_05] },
    { amounts: [C.E18_1000, C.E18_1000, C.E18_1000, C.E18_1000], rates: [C.E18_05, C.E18_1, C.E18_10, C.E18_13] },
    { amounts: [C.E18_10, C.E18_12, C.E18_13, C.E18_1000], rates: [C.E18_05, C.E18_10, C.E18_1, C.E18_3] },
    {
      amounts: [C.randomBigNum(18, 100, 2), C.randomBigNum(18, 100, 4), C.randomBigNum(18, 500, 5), C.randomBigNum(18, 1000, 3)],
      rates: [C.E18_05, C.E18_1, C.E18_1, C.E18_3],
    },
    {
      amounts: [C.randomBigNum(6, 100, 10), C.randomBigNum(6, 100, 12), C.randomBigNum(7, 100, 11), C.randomBigNum(1, 1000, 10)],
      rates: [C.E6_10, C.E6_10, C.E6_10, C.ONE],
    },
  ];
  const timeParamsMatrix = [
    { starts: [0, 0, 0, 0], cliffs: [0, 0, 0, 0], unlocks: [0, 0, 0, 0], timeShift: 10 },
    { starts: [0, 100, 500, 1000], cliffs: [0, 500, 1000, 5000], unlocks: [0, 0, 700, 7000], timeShift: 10 },
    { starts: [-50, -100, -200, -1000], cliffs: [-50, -50, -200, -500], unlocks: [-25, 0, -200, 0], timeShift: 10 },
  ];
  amountParamsMatrix.forEach((amountParam) => {
    timeParamsMatrix.forEach((timeParam) => {
      redeemTest(true, false, amountParam, timeParam);
      redeemTest(false, false, amountParam, timeParam);
      redeemTest(false, true, amountParam, timeParam);
      reedeemMulitpleTest(true, false, amountParam, timeParam);
      reedeemMulitpleTest(false, true, amountParam, timeParam);
      reedeemMulitpleTest(false, false, amountParam, timeParam);
      redeemAllTest(true, false, amountParam, timeParam);
      redeemAllTest(false, true, amountParam, timeParam);
      redeemAllTest(false, false, amountParam, timeParam);
      transferAndRedeemTest(amountParam, timeParam);
    });
  });
  redeemErrorTests(true, false);
  redeemErrorTests(false, true);
  redeemErrorTests(false, false);
});

// describe('Testing the locked token balance, and delegation of locked balances', () => {
//     delegateTests();
// });
