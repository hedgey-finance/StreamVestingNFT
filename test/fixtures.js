const WETH9 = require('@thenextblock/hardhat-weth');
const { ethers } = require('hardhat');
const C = require('./constants');

async function setupVesting() {
  const [creator, a, b, c] = await ethers.getSigners();
  const streamLib = await ethers.deployContract('StreamingLibrary');
  const Vesting = await ethers.getContractFactory('StreamVestingNFT', {
    libraries: {
      StreamingLibrary: streamLib.address,
    },
  });
  const vesting = await Vesting.deploy('Streamers', 'STMY');

  const BatchVesting = await ethers.getContractFactory('BatchVesting');
  const bacthVesting = BatchVesting.deploy();

  const Token = await ethers.getContractFactory('Token');

  const token = await Token.deploy(C.E18_10000, '18', 'Token', 'TK');
  const usdc = await Token.deploy(C.E18_10000, '6', 'USDC', 'USDC');

  await token.approve(vesting.address, C.E18_10000);
  await usdc.approve(vesting.address, C.E18_10000);
  return {
    creator,
    a,
    b,
    c,
    token,
    usdc,
    vesting,
    bacthVesting,
  };
}

async function setupStreaming() {
  const [creator, a, b, c] = await ethers.getSigners();
  const streamLib = await ethers.deployContract('StreamLibrary');
  const Streaming = await ethers.getContractFactory('StreamingHedgeys', {
    libraries: {
      StreamLibrary: streamLib.address,
    },
  });
  const streaming = await Streaming.deploy('StreamingHedgeys', 'STHD');

  const BatchStreamer = await ethers.getContractFactory('BatchStreamer');
  const batchStreamer = BatchStreamer.deploy();

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
    batchStreamer,
  };
}

module.exports = {
  setupVesting,
  setupStreaming,
};
