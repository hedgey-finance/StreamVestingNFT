const WETH9 = require('@thenextblock/hardhat-weth');
const { ethers } = require('hardhat');
const C = require('./constants');

async function setupStreaming() {
  const [creator, a, b, c] = await ethers.getSigners();

  const streaming = await ethers.deployContract('StreamVestingNFT', ['Streamers', 'STMY']);

  const Token = await ethers.getContractFactory('Token');

  const token = await Token.deploy(C.E18_10000, '18', 'Token', 'TK');
  const usdc = await Token.deploy(C.E18_10000, '6', 'USDC', 'USDC');

  await token.approve(streaming.address, C.E18_10000);
  await usdc.approve(streaming.address, C.E18_10000);
  return {
    creator,
    a,
    b,
    c,
    token,
    usdc,
    streaming,
  };
}

module.exports = {
  setupStreaming,
};
