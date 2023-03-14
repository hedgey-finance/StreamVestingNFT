const { expect } = require('chai');
const { setupStreaming, setupVesting } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');
const { ethers } = require('hardhat');

/**  create tests need to: 
1. Test basic create with various amounts rates, start dates, cliffs, unlocks dates
  - check the balance of the contract after matches the amount
  - check the struct held in storage matches
  - check the events spit off properly
  - check moving forward in time that the balances are what the should be
  - check the end date calculation
  ... should have a mix of streams and single date vests as well, before, at now, and in future
2. Reverting tests
  - check it reverts if the allowance is 0
  - check it reverts if the holder is 0 address (or manager is holder for vesting)
  - check it reverts if the token address is 0
  - check it reverts if the rate is 0 and rate is greater than the amount
*/


const createTests = (vesting, locked, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, c, token;
  let amount, now, start, cliff, rate, admin, unlock, transferLock, timeShift;
  it(`Creator Mints a ${vesting ? 'vesting' : 'streaming'} NFT to wallet A with ${ethers.utils.formatEther(
    amountParams.amount
  )} at a rate of ${ethers.utils.formatEther(amountParams.rate)}`, async () => {
    s = vesting ? await setupVesting() : await setupStreaming(bound);
    now = await time.latest();
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    c = s.c;
    token = s.token;
    usdc = s.usdc;
    amount = amountParams.amount;
    rate = amountParams.rate;
    start = timeParams.startShift + now;
    cliff = timeParams.cliffShift + now;
    transferLock = timeParams.transferLock;
    timeShift = timeParams.timeShift;
    admin = creator.address;
    unlock = timeParams.unlockShift + now;
    let end = C.calculateEnd(amount, rate, start);
    cliff = Math.min(cliff, end);
    if (vesting) {
      if (locked) {
        const tx = await streaming.createLockedNFT(
          a.address,
          token.address,
          amount,
          start,
          cliff,
          rate,
          admin,
          unlock,
          transferLock
        );
        expect(tx)
          .to.emit('NFTCreated')
          .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, admin, unlock, transferLock);
        const tokenBalance = await token.balanceOf(streaming.address);
        expect(tokenBalance).to.eq(amount);
        const stream = await streaming.streams('1');
        expect(stream.token).to.eq(token.address);
        expect(stream.amount).to.eq(amount);
        expect(stream.start).to.eq(start);
        expect(stream.cliffDate).to.eq(cliff);
        expect(stream.rate).to.eq(rate);
        expect(stream.vestingAdmin).to.eq(admin);
        expect(stream.unlockDate).to.eq(unlock);
        expect(stream.transferableNFTLocker).to.eq(transferLock);

        expect(await streaming.getStreamEnd('1')).to.eq(end);
        // balance checks of NFT
        expect(await streaming.balanceOf(a.address)).to.eq('1');
        expect(await streaming.ownerOf('1')).to.eq(a.address);

        let currentTime = await time.latest();
        // checks for streaming balances
        let calcBalances = C.calculateBalances(start, cliff, amount, rate, currentTime);
        let streamBalanceOf = await streaming.streamBalanceOf('1');
        expect(calcBalances.balance).to.eq(streamBalanceOf.balance);
        expect(calcBalances.remainder).to.eq(streamBalanceOf.remainder);

        // move forward in time and check
        let newTime = await time.increase(timeShift);
        calcBalances = C.calculateBalances(start, cliff, amount, rate, newTime);
        streamBalanceOf = await streaming.streamBalanceOf('1');
        expect(calcBalances.balance).to.eq(streamBalanceOf.balance);
        expect(calcBalances.remainder).to.eq(streamBalanceOf.remainder);
      } else {
        const tx = await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, admin);
        expect(tx)
          .to.emit('NFTCreated')
          .withArgs('1', a.address, token.address, amount, start, cliff, end, rate, admin, '0', false);
        const tokenBalance = await token.balanceOf(streaming.address);
        expect(tokenBalance).to.eq(amount);
        const stream = await streaming.streams('1');
        expect(stream.token).to.eq(token.address);
        expect(stream.amount).to.eq(amount);
        expect(stream.start).to.eq(start);
        expect(stream.cliffDate).to.eq(cliff);
        expect(stream.rate).to.eq(rate);
        expect(stream.vestingAdmin).to.eq(admin);
        expect(stream.unlockDate).to.eq(0);
        expect(stream.transferableNFTLocker).to.eq(false);

        expect(await streaming.getStreamEnd('1')).to.eq(end);
        // balance checks of NFT
        expect(await streaming.balanceOf(a.address)).to.eq('1');
        expect(await streaming.ownerOf('1')).to.eq(a.address);

        let currentTime = await time.latest();
        // checks for streaming balances
        let calcBalances = C.calculateBalances(start, cliff, amount, rate, currentTime);
        let streamBalanceOf = await streaming.streamBalanceOf('1');
        expect(calcBalances.balance).to.eq(streamBalanceOf.balance);
        expect(calcBalances.remainder).to.eq(streamBalanceOf.remainder);

        let newTime = await time.increase(timeShift);
        calcBalances = C.calculateBalances(start, cliff, amount, rate, newTime);
        streamBalanceOf = await streaming.streamBalanceOf('1');
        expect(calcBalances.balance).to.eq(streamBalanceOf.balance);
        expect(calcBalances.remainder).to.eq(streamBalanceOf.remainder);
      }
    } else {
      const tx = await streaming.createNFT(a.address, token.address, amount, start, cliff, rate);
      expect(tx).to.emit('NFTCreated').withArgs('1', a.address, token.address, amount, start, cliff, end, rate);
      const tokenBalance = await token.balanceOf(streaming.address);
      expect(tokenBalance).to.eq(amount);
      const stream = await streaming.streams('1');
      expect(stream.token).to.eq(token.address);
      expect(stream.amount).to.eq(amount);
      expect(stream.start).to.eq(start);
      expect(stream.cliffDate).to.eq(cliff);
      expect(stream.rate).to.eq(rate);

      expect(await streaming.getStreamEnd('1')).to.eq(end);
      // balance checks of NFT
      expect(await streaming.balanceOf(a.address)).to.eq('1');
      expect(await streaming.ownerOf('1')).to.eq(a.address);

      let currentTime = await time.latest();
      // checks for streaming balances
      let calcBalances = C.calculateBalances(start, cliff, amount, rate, currentTime);
      let streamBalanceOf = await streaming.streamBalanceOf('1');
      expect(calcBalances.balance).to.eq(streamBalanceOf.balance);
      expect(calcBalances.remainder).to.eq(streamBalanceOf.remainder);

      let newTime = await time.increase(timeShift);
      calcBalances = C.calculateBalances(start, cliff, amount, rate, newTime);
      streamBalanceOf = await streaming.streamBalanceOf('1');
      expect(calcBalances.balance).to.eq(streamBalanceOf.balance);
      expect(calcBalances.remainder).to.eq(streamBalanceOf.remainder);
    }
  });
};

const createErrorTests = (vesting, locked, bound) => {
  let s, streaming, creator, a, b, c, token;
  let amount, start, cliff, rate, admin, unlock;
  it(`reverts if the allowance is 0 of the minter`, async () => {
    s = vesting ? await setupVesting() : await setupStreaming(bound);
    now = await time.latest();
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    c = s.c;
    token = s.token;
    amount = C.E18_1;
    start = await time.latest();
    cliff = start;
    rate = amount;
    admin = creator.address;
    unlock = start;

    if (vesting) {
      if (locked) {
        await expect(
          streaming
            .connect(a)
            .createLockedNFT(a.address, token.address, amount, start, cliff, rate, admin, unlock, false)
        ).to.be.revertedWith('THL01');
      } else {
        await expect(
          streaming.connect(a).createNFT(a.address, token.address, amount, start, cliff, rate, admin)
        ).to.be.revertedWith('THL01');
      }
    } else {
      await expect(
        streaming.connect(a).createNFT(a.address, token.address, amount, start, cliff, rate)
      ).to.be.revertedWith('THL01');
    }
  });
  it(`reverts if the holder is the 0 address or manager is the same as the minter`, async () => {
    if (vesting) {
      if (locked) {
        await expect(
          streaming.createLockedNFT(C.ZERO_ADDRESS, token.address, amount, start, cliff, rate, admin, unlock, false)
        ).to.be.revertedWith('SV02');
        await expect(
          streaming.createLockedNFT(a.address, token.address, amount, start, cliff, rate, a.address, unlock, false)
        ).to.be.revertedWith('SV02');
      } else {
        await expect(
          streaming.createNFT(C.ZERO_ADDRESS, token.address, amount, start, cliff, rate, admin)
        ).to.be.revertedWith('SV02');
        await expect(
          streaming.createNFT(a.address, token.address, amount, start, cliff, rate, a.address)
        ).to.be.revertedWith('SV02');
      }
    } else {
      await expect(streaming.createNFT(C.ZERO_ADDRESS, token.address, amount, start, cliff, rate)).to.be.revertedWith(
        'SV02'
      );
    }
  });
  it(`reverts if the token address is 0`, async () => {
    let tokenAddress = C.ZERO_ADDRESS;
    if (vesting) {
      if (locked) {
        await expect(
          streaming.createLockedNFT(a.address, tokenAddress, amount, start, cliff, rate, admin, unlock, false)
        ).to.be.revertedWith('SV03');
      } else {
        await expect(
          streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate, admin)
        ).to.be.revertedWith('SV03');
      }
    } else {
      await expect(streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate)).to.be.revertedWith('SV03');
    }
  });
  it(`reverts if the amount is 0`, async () => {
    let tokenAddress = token.address;
    amount = C.ZERO;
    if (vesting) {
      if (locked) {
        await expect(
          streaming.createLockedNFT(a.address, tokenAddress, amount, start, cliff, rate, admin, unlock, false)
        ).to.be.revertedWith('SV04');
      } else {
        await expect(
          streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate, admin)
        ).to.be.revertedWith('SV04');
      }
    } else {
      await expect(streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate)).to.be.revertedWith('SV04');
    }
  });
  it(`reverts if the rate is 0`, async () => {
    let tokenAddress = token.address;
    amount = C.E18_1;
    rate = C.ZERO;
    if (vesting) {
      if (locked) {
        await expect(
          streaming.createLockedNFT(a.address, tokenAddress, amount, start, cliff, rate, admin, unlock, false)
        ).to.be.revertedWith('SV05');
      } else {
        await expect(
          streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate, admin)
        ).to.be.revertedWith('SV05');
      }
    } else {
      await expect(streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate)).to.be.revertedWith('SV05');
    }
  });
  it(`reverts if the rate is greater than the amount`, async () => {
    let tokenAddress = token.address;
    amount = C.E18_1;
    rate = C.E18_10;
    if (vesting) {
      if (locked) {
        await expect(
          streaming.createLockedNFT(a.address, tokenAddress, amount, start, cliff, rate, admin, unlock, false)
        ).to.be.revertedWith('SV05');
      } else {
        await expect(
          streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate, admin)
        ).to.be.revertedWith('SV05');
      }
    } else {
      await expect(streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate)).to.be.revertedWith('SV05');
    }
  });
  it('reverts if the cliff date exceeds the fully vested end date', async () => {
    let tokenAddress = token.address;
    amount = C.E18_10;
    rate = C.E18_1;
    start = await time.latest();
    end = C.calculateEnd(amount, rate, start);
    cliff = end + 1;
    if (vesting) {
      if (locked) {
        await expect(
          streaming.createLockedNFT(a.address, tokenAddress, amount, start, cliff, rate, admin, unlock, false)
        ).to.be.revertedWith('SV12');
      } else {
        await expect(
          streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate, admin)
        ).to.be.revertedWith('SV12');
      }
    } else {
      await expect(streaming.createNFT(a.address, tokenAddress, amount, start, cliff, rate)).to.be.revertedWith('SV12');
    }
  });
};

module.exports = {
  createTests,
  createErrorTests,
};
