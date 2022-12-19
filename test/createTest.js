const { expect } = require('chai');
const { setupStreaming } = require('./fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('./constants');
const { BigNumber } = require('ethers');

module.exports = () => {
  let streaming, creator, a, b, c, token, usdc;
  let amount, start, cliff, rate, revocable, manager, end;

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
    revocable = true;
    manager = creator.address;
    end = start + amount.div(rate);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, revocable, manager))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, revocable, manager);
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
  it('Creates an NFT that vests in a single second block', async () => {
    rate = amount;
    start = (await time.latest()) + 60;
    cliff = start;
    end = start + amount.div(rate);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, revocable, manager))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, revocable, manager);
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
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, revocable, manager))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, revocable, manager);
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
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, revocable, manager))
      .to.emit('NFTCreated')
      .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, revocable, manager);
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
    await expect(streaming.createNFT(a.address, token.address, 0, start, cliff, rate, revocable, manager)).to.be
      .reverted;
  });
  it('Will revert if the holder or manager address is 0', async () => {
    await expect(streaming.createNFT(C.ZERO_ADDRESS, token.address, amount, start, cliff, rate, revocable, manager)).to
      .be.reverted;
    await expect(streaming.createNFT(a.address, token.address, amount, start, cliff, rate, revocable, C.ZERO_ADDRESS))
      .to.be.reverted;
  });
  it('Will revert if the token address is the 0 address', async () => {
    await expect(streaming.createNFT(a.address, C.ZERO_ADDRESS, amount, start, cliff, rate, revocable, manager)).to.be
      .reverted;
  });
  it('Will revert if the rate is 0 or greater than the amount', async () => {
    await expect(streaming.createNFT(a.address, token.address, amount, start, cliff, 0, revocable, manager)).to.be
      .reverted;
    await expect(
      streaming.createNFT(a.address, token.address, amount, start, cliff, amount.add(10), revocable, manager)
    ).to.be.reverted;
  });
};
