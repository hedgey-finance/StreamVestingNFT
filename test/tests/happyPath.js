const { expect } = require('chai');
const { setupStreaming, setupBoundStreaming, setupVesting } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

// happy path testing for each of the contracts
// includes minting an NFT, partially redeeming, then fully redeeming it

module.exports = (vesting, bound, amountParams, timeParams) => {
  let streaming, creator, a, b, c, token, usdc;
  let amount, now, start, cliff, rate, end, admin, unlock;
  it(`Mints an vesting=${vesting} NFT to wallet A with ${ethers.utils.formatEther(
    amountParams.amount
  )} at a rate of ${ethers.utils.formatEther(amountParams.rate)}`, async () => {
    let s;
    if (vesting == true) {
      s = await setupVesting();
    } else if (bound == true) {
      s = await setupBoundStreaming();
    } else {
      s = await setupStreaming();
    }
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    c = s.c;
    token = s.token;
    usdc = s.usdc;
    now = await time.latest();
    amount = amountParams.amount;
    rate = amountParams.rate;
    start = timeParams.startShift + now;
    cliff = timeParams.cliffShift;
    admin = creator.address;
    unlock = '0';
    if (vesting) {
      expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, admin, unlock))
        .to.emit('NFTCreated')
        .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, admin, unlock);
    } else {
      expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate))
        .to.emit('NFTCreated')
        .withArgs('1', a.address, token.address, amount, start, cliff, end, rate);
    }
    end = await streaming.getStreamEnd('1');
    const newTime = await time.latest();
    const timePassed = newTime - start;
    const balances = await streaming.streamBalanceOf('1');
    const calculatedBalance = C.bigMin(rate.mul(timePassed), amount);
    expect(balances.balance).to.eq(calculatedBalance);
    expect(balances.remainder).to.eq(amount.sub(balances.balance));
    expect(await streaming.balanceOf(a.address)).to.eq(1);
    expect(await token.balanceOf(streaming.address)).to.eq(amount);
  });
  it('Wallet A redeems the NFT', async () => {
    // move forward some seconds
    const shiftedTime = await time.increase(timeParams.timeShift);
    const timePassed = shiftedTime - start;
    let balances = await streaming.streamBalanceOf('1');
    let calculatedBalance = C.bigMin(rate.mul(timePassed), amount);
    // should equal rate * timeshift
    expect(balances.balance).to.eq(calculatedBalance);
    expect(balances.remainder).to.eq(amount.sub(calculatedBalance));
    const tx = await streaming.connect(a).redeemNFT(['1']);
    expect(tx).to.emit(streaming, 'NFTRedeemed');
    const receipt = await tx.wait();
    const event = receipt.events[receipt.events.length - 1];
    const balance = event.args.balance;
    const remainder = event.args.remainder;
    let tokenBalanceofA = await token.balanceOf(a.address);
    let tokenBalanceofContract = await token.balanceOf(streaming.address);
    expect(tokenBalanceofA).to.eq(balance);
    expect(tokenBalanceofContract).to.eq(remainder);
    let finalAmount = (await streaming.streams('1')).amount;
    expect(finalAmount).to.eq(remainder);

    if (remainder > 0) {
      // if theres anything left, lets go to the end and redeem again
      await time.increaseTo(end);
      balances = await streaming.streamBalanceOf('1');
      expect(balances.balance).to.eq(finalAmount);
      expect(await streaming.connect(a).redeemNFT(['1']))
        .to.emit('NFTRedeemed')
        .withArgs('1', finalAmount, 0);
      tokenBalanceofA = await token.balanceOf(a.address);
      tokenBalanceofContract = await token.balanceOf(streaming.address);
      expect(tokenBalanceofA).to.eq(amount);
      expect(tokenBalanceofContract).to.eq(0);
    }
  });
};
