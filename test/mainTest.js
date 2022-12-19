//main group of testing after creation stage
// testing revocable, not revocable, redemption, partial redemption, bulk redemption

const { expect } = require('chai');
const { setupStreaming } = require('./fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('./constants');
const { BigNumber } = require('ethers');

const redeemTest = (timeDelay, cliffDelay, amt, rt) => {
  let streaming, creator, a, b, c, token, usdc;
  let amount, start, cliff, rate, revocable, manager, end;
  //basic redeem test
  it('Creates an NFT for wallet A and then redeems over time', async () => {
    const s = await setupStreaming();
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    c = s.c;
    token = s.token;
    usdc = s.usdc;
    await streaming.updateBaseURI('tokens/');
    amount = amt;
    rate = rt;
    start = (await time.latest()) + timeDelay;
    cliff = start + cliffDelay;
    revocable = true;
    manager = creator.address;
    end = start + amount.div(rate);
    await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, revocable, manager);
    await time.increase(10);
    let streamValues = await streaming.streamBalanceOf('1');
    expect(await streaming.redeemNFT('1')).to.emit('NFTPartiallyRedeemed').withArgs('1', streamValues[1], streamValues[0]);
    //check that wallet A actually  got the tokens
    expect(await token.balanceOf(a.address)).to.eq(streamValues[0]);
    // check the amount is not in the nft address
    expect(await token.balanceOf(streaming.address)).to.eq(amount.sub(streamValues[0]));
  });
};
