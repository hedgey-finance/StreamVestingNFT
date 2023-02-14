const WETH9 = require('@thenextblock/hardhat-weth');
const { ethers } = require('hardhat');
const C = require('./constants');

async function setupVesting() {
  const [creator, a, b, c] = await ethers.getSigners();
  const streamLib = await ethers.deployContract('StreamLibrary');
  const Streaming = await ethers.getContractFactory('StreamVestingNFT', {
    libraries: {
      StreamLibrary: streamLib.address,
    },
  });
  const streaming = await Streaming.deploy('Streamers', 'STMY');

  const BatchStreamer = await ethers.getContractFactory('BatchVester');
  const batchStreamer = await BatchStreamer.deploy();

  const Token = await ethers.getContractFactory('Token');

  const token = await Token.deploy(C.E18_10000, '18', 'Token', 'TK');
  const usdc = await Token.deploy(C.E18_10000, '6', 'USDC', 'USDC');

  await token.approve(streaming.address, C.E18_10000);
  await token.approve(batchStreamer.address, C.E18_10000);
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
  const batchStreamer = await BatchStreamer.deploy();

  const Token = await ethers.getContractFactory('Token');

  const token = await Token.deploy(C.E18_10000, '18', 'Token', 'TK');
  const usdc = await Token.deploy(C.E18_10000, '6', 'USDC', 'USDC');

  await token.approve(streaming.address, C.E18_10000);
  await token.approve(batchStreamer.address, C.E18_10000);
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

async function setupBoundStreaming() {
  const [creator, a, b, c] = await ethers.getSigners();
  const streamLib = await ethers.deployContract('StreamLibrary');
  const Streaming = await ethers.getContractFactory('StreamingBoundHedgeys', {
    libraries: {
      StreamLibrary: streamLib.address,
    },
  });
  const streaming = await Streaming.deploy('StreamingBoundHedgeys', 'STHD');

  const BatchStreamer = await ethers.getContractFactory('BatchStreamer');
  const batchStreamer = await BatchStreamer.deploy();

  const Token = await ethers.getContractFactory('Token');

  const token = await Token.deploy(C.E18_10000, '18', 'Token', 'TK');
  const usdc = await Token.deploy(C.E18_10000, '6', 'USDC', 'USDC');

  await token.approve(streaming.address, C.E18_10000);
  await token.approve(batchStreamer.address, C.E18_10000);
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
  setupBoundStreaming,
};
