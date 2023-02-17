const { ethers } = require('hardhat');
const C = require('./constants');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

async function setupVesting() {
  const [creator, a, b, c] = await ethers.getSigners();

  const TransferLocker = await ethers.getContractFactory('StreamingHedgeys');

  const NoTransferLocker = await ethers.getContractFactory('StreamingBoundHedgeys');

  const transferLocker = await TransferLocker.deploy('StreamingHedgeys', 'STHD');
  const notransferLocker = await NoTransferLocker.deploy('BoundHedgeys', 'BHDG');

  const Streaming = await ethers.getContractFactory('StreamVestingNFT');
  const streaming = await Streaming.deploy('Streamers', 'STMY', transferLocker.address, notransferLocker.address);

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
    transferLocker,
    notransferLocker,
  };
}

async function setupStreaming(bound) {
  const [creator, a, b, c] = await ethers.getSigners();
  const streamLib = await ethers.deployContract('StreamLibrary');
  const Streaming = bound
    ? await ethers.getContractFactory('StreamingHedgeys')
    : await ethers.getContractFactory('StreamingBoundHedgeys');
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

async function peMintedVesting(amountParams, timeParams) {
  const s = await setupVesting();
  /// mint a bunch of NFTs
  const streaming = s.streaming
  const a = s.a;
  const b = s.b;
  const creator = s.creator;
  const token = s.token;
  const usdc = s.usdc;
  let now = await time.latest();
  for (let i = 0; i < amountParams.amounts.length; i++) {
    let amount = amountParams.amounts[i];
    let rate = amountParams.rates[i];
    let start = timeParams.starts[i] + now;
    let cliff = timeParams.cliffs[i] + now;
    let unlock = timeParams.unlocks[i] + now;
    let admin = s.creator.address;
    let tokenAddress = i % 2 == 0 ? token.address : usdc.address;
    await streaming.createLockedNFT(a.address, tokenAddress, amount, start, cliff, rate, admin, unlock, true);
  }
  return {
    creator,
    a,
    b,
    token,
    usdc,
    streaming
  }
}

async function preMintedStreaming(bound, amountParams, timeParams) {
  const s = await setupStreaming(bound);
  const streaming = s.streaming
  const a = s.a;
  const b = s.b;
  const creator = s.creator;
  const token = s.token;
  const usdc = s.usdc;
  let now = await time.latest();
  for (let i = 0; i < amountParams.amounts.length; i++) {
    let amount = amountParams.amounts[i];
    let rate = amountParams.rates[i];
    let start = timeParams.starts[i] + now;
    let cliff = timeParams.cliffs[i] + now;
    let tokenAddress = i % 2 == 0 ? token.address : usdc.address;
    await streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate);
  }
  return {
    creator,
    a,
    b,
    token,
    usdc,
    streaming
  }
}

module.exports = {
  setupVesting,
  setupStreaming,
  peMintedVesting,
  preMintedStreaming,
};
