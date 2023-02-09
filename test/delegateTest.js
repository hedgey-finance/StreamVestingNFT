const { expect } = require('chai');
const { setupStreaming, setupVesting } = require('./fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('./constants');
const { BigNumber } = require('ethers');


// purpose of these tests is to ensure that the enumerate array for the owned tokens works correctly for the delegated tokens
const delegateTests = () => {
  let streaming, creator, a, b, c, token, usdc;
  let amount, start, cliff, rate, end;
  
};
