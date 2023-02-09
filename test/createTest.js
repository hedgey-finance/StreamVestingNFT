const { expect } = require('chai');
const { setupStreaming, setupVesting } = require('./fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('./constants');
const { BigNumber } = require('ethers');

 const createStreamTest = () => {
  let streaming, creator, a, b, c, token, usdc;
  let amount, start, cliff, rate, end;

  it('Creates a new streaming NFT for wallet A', async () => {
    const s = await setupStreaming();
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    c = s.c;
    token = s.token;
    usdc = s.usdc;
    await streaming.updateBaseURI('tokens/');
    amount = C.E18_100;
    rate = C.E18_1;
    start = await time.latest();
    cliff = start;
    end = start + amount.div(rate);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate);
    expect(await token.balanceOf(streaming.address)).to.eq(amount);
    expect(await streaming.balanceOf(a.address)).to.eq(1);
    expect(await streaming.lockedBalance(a.address, token.address)).to.eq(amount);
    //increase time to check updated balances
    await time.increase(10);
    const streamValues = await streaming.streamBalanceOf('1');
    const passedSeconds = (await time.latest()) - start;
    const remainder = amount.sub(rate.mul(passedSeconds));
    const streamBal = amount.sub(remainder);
    expect(streamValues[1]).to.eq(remainder);
    expect(streamValues[0]).to.eq(streamBal);
  });
  it('Creates an NFT that streams in a single second block', async () => {
    rate = amount;
    start = (await time.latest()) + 60;
    cliff = start;
    end = start + amount.div(rate);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate);
    // progress 59 seconds and check remainder is still total amount
    await time.increase(59);
    let streamValues = await streaming.streamBalanceOf('2');
    expect(streamValues[1]).to.eq(amount);
    expect(streamValues[0]).to.eq(0);
    // move 1 second to see that its flipped entirley to available now
    await time.increase(1);
    streamValues = await streaming.streamBalanceOf('2');
    expect(streamValues[1]).to.eq(0);
    expect(streamValues[0]).to.eq(amount);
  });
  it('Creates an NFT with a back-dated start and cliff date', async () => {
    rate = C.E18_1;
    start = (await time.latest()) - 40;
    cliff = start;
    end = start + amount.div(rate);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate);
    // expecting that 40 of the tokens are in balance and 60 in streaming
    const streamValues = await streaming.streamBalanceOf('3');
    const passedSeconds = (await time.latest()) - start;
    const remainder = amount.sub(rate.mul(passedSeconds));
    const streamBal = amount.sub(remainder);
    expect(streamValues[1]).to.eq(remainder);
    expect(streamValues[0]).to.eq(streamBal);
  });
  it('Creates an NFT with back dated start date, and future cliff vesting date', async () => {
    rate = C.E18_1;
    start = (await time.latest()) - 10;
    cliff = start + 30;
    end = start + amount.div(rate);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate);
    // expecting that its 0 till cliff has passed
    let streamValues = await streaming.streamBalanceOf('4');
    expect(streamValues[1]).to.eq(amount);
    expect(streamValues[0]).to.eq(0);
    // move up 20 seconds post cliff time
    await time.increase(20);
    const passedSeconds = (await time.latest()) - start;
    streamValues = await streaming.streamBalanceOf('4');
    const remainder = amount.sub(rate.mul(passedSeconds));
    const streamBal = amount.sub(remainder);
    expect(streamValues[1]).to.eq(remainder);
    expect(streamValues[0]).to.eq(streamBal);
  });
  it('Will revert if the allowance is amount is 0', async () => {
    await expect(streaming.createNFT(a.address, token.address, 0, start, cliff, rate)).to.be
      .reverted;
  });
  it('Will revert if the holder address is 0', async () => {
    await expect(streaming.createNFT(C.ZERO_ADDRESS, token.address, amount, start, cliff, rate)).to
      .be.reverted;
  });
  it('Will revert if the token address is the 0 address', async () => {
    await expect(streaming.createNFT(a.address, C.ZERO_ADDRESS, amount, start, cliff, rate)).to.be
      .reverted;
  });
  it('Will revert if the rate is 0 or greater than the amount', async () => {
    await expect(streaming.createNFT(a.address, token.address, amount, start, cliff, 0)).to.be
      .reverted;
    await expect(
      streaming.createNFT(a.address, token.address, amount, start, cliff, amount.add(10))
    ).to.be.reverted;
  });
};

const createVestTest = () => {
  let vesting, creator, a, b, c, token, usdc;
  let amount, start, cliff, rate, end, manager, unlockDate;

  it('Creates a new streaming NFT for wallet A', async () => {
    const v = await setupVesting();
    vesting = v.streaming;
    creator = v.creator;
    manager = creator.address;
    a = v.a;
    b = v.b;
    c = v.c;
    token = v.token;
    usdc = v.usdc;
    await vesting.updateBaseURI('tokens/');
    amount = C.E18_100;
    rate = C.E18_1;
    start = await time.latest();
    cliff = start;
    end = start + amount.div(rate);
    unlockDate = '0';
    expect(await vesting.createNFT(a.address, token.address, amount, start, cliff, rate, manager, unlockDate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, manager);
    expect(await token.balanceOf(vesting.address)).to.eq(amount);
    expect(await vesting.balanceOf(a.address)).to.eq(1);
    expect(await vesting.lockedBalance(a.address, token.address)).to.eq(amount);
    //increase time to check updated balances
    await time.increase(10);
    const vestingValues = await vesting.streamBalanceOf('1');
    const passedSeconds = (await time.latest()) - start;
    const remainder = amount.sub(rate.mul(passedSeconds));
    const streamBal = amount.sub(remainder);
    expect(vestingValues[1]).to.eq(remainder);
    expect(vestingValues[0]).to.eq(streamBal);
  });
  it('Creates an NFT that streams in a single second block', async () => {
    rate = amount;
    start = (await time.latest()) + 60;
    cliff = start;
    end = start + amount.div(rate);
    expect(await vesting.createNFT(a.address, token.address, amount, start, cliff, rate, manager, unlockDate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, manager, unlockDate);
    // progress 59 seconds and check remainder is still total amount
    await time.increase(59);
    let vestingValues = await vesting.streamBalanceOf('2');
    expect(vestingValues[1]).to.eq(amount);
    expect(vestingValues[0]).to.eq(0);
    // move 1 second to see that its flipped entirley to available now
    await time.increase(1);
    vestingValues = await vesting.streamBalanceOf('2');
    expect(vestingValues[1]).to.eq(0);
    expect(vestingValues[0]).to.eq(amount);
  });
  it('Creates an NFT with a back-dated start and cliff date', async () => {
    rate = C.E18_1;
    start = (await time.latest()) - 40;
    cliff = start;
    end = start + amount.div(rate);
    expect(await vesting.createNFT(a.address, token.address, amount, start, cliff, rate, manager, unlockDate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, manager, unlockDate);
    // expecting that 40 of the tokens are in balance and 60 in vesting
    const vestingValues = await vesting.streamBalanceOf('3');
    const passedSeconds = (await time.latest()) - start;
    const remainder = amount.sub(rate.mul(passedSeconds));
    const streamBal = amount.sub(remainder);
    expect(vestingValues[1]).to.eq(remainder);
    expect(vestingValues[0]).to.eq(streamBal);
  });
  it('Creates an NFT with back dated start date, and future cliff vesting date', async () => {
    rate = C.E18_1;
    start = (await time.latest()) - 10;
    cliff = start + 30;
    end = start + amount.div(rate);
    expect(await vesting.createNFT(a.address, token.address, amount, start, cliff, rate, manager, unlockDate))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, manager, unlockDate);
    // expecting that its 0 till cliff has passed
    let vestingValues = await vesting.streamBalanceOf('4');
    expect(vestingValues[1]).to.eq(amount);
    expect(vestingValues[0]).to.eq(0);
    // move up 20 seconds post cliff time
    await time.increase(20);
    const passedSeconds = (await time.latest()) - start;
    vestingValues = await vesting.streamBalanceOf('4');
    const remainder = amount.sub(rate.mul(passedSeconds));
    const streamBal = amount.sub(remainder);
    expect(vestingValues[1]).to.eq(remainder);
    expect(vestingValues[0]).to.eq(streamBal);
  });
  it('Will revert if the allowance is amount is 0', async () => {
    await expect(vesting.createNFT(a.address, token.address, 0, start, cliff, rate, manager, unlockDate)).to.be
      .reverted;
  });
  it('Will revert if the holder address is 0', async () => {
    await expect(vesting.createNFT(C.ZERO_ADDRESS, token.address, amount, start, cliff, rate, manager, unlockDate)).to
      .be.reverted;
  });
  it('Will revert if the token address is the 0 address', async () => {
    await expect(vesting.createNFT(a.address, C.ZERO_ADDRESS, amount, start, cliff, rate, manager, unlockDate)).to.be
      .reverted;
  });
  it('Will revert if the rate is 0 or greater than the amount', async () => {
    await expect(vesting.createNFT(a.address, token.address, amount, start, cliff, 0, manager, unlockDate)).to.be
      .reverted;
    await expect(
      vesting.createNFT(a.address, token.address, amount, start, cliff, amount.add(10), manager, unlockDate)
    ).to.be.reverted;
  });
};


module.exports = {
  createStreamTest,
  createVestTest,
}