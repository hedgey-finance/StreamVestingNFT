const { expect } = require('chai');
const { setupVesting } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

/**Revoking tests for the StreamVesting Only
 * 1. Test that an NFT can be revoked at any time before the fully vested date
 *   - check that the balances are sent to the vestor and back to vestAdmin
 *   - check if the unlockDate is set in the future that the vestor recieves a new NFT instead of tokens
 *   - check that the redeemed NFT is deleted from memory
 * 2. Error tests
 *   - check that it cannot be revoked if there is no remainder
 *   - check that it cannot be revoked twice
 *   - check that only the vestingAdmin can revoke the token
 */

const revokeTest = (amountParams, timeParams, transferLock) => {
  let s, streaming, creator, a, b, token, transferLocker, noTransferLocker;
  it(`revokes an NFT with ${C.getVal(amountParams.amount)} vesting tokens, start ${
    timeParams.startShift
  } seconds from now, cliff ${timeParams.cliffShift} seconds from now, and unlocking ${
    timeParams.unlockShift
  } seconds from now`, async () => {
    s = await setupVesting();
    streaming = s.streaming;
    creator = s.creator;
    let vestingAdmin = creator.address;
    a = s.a;
    b = s.b;
    token = s.token;
    transferLocker = s.transferLocker;
    noTransferLocker = s.noTransferLocker;
    let amount = amountParams.amount;
    let rate = amountParams.rate;
    let timeShift = timeParams.timeShift;
    let now = await time.latest();
    let start = now + timeParams.startShift;
    let cliff = now + timeParams.cliffShift;
    let end = C.calculateEnd(amount, rate, start);
    cliff = Math.min(cliff, end);
    let unlock = now + timeParams.unlockShift;
    await streaming.createLockedNFT(
      a.address,
      token.address,
      amount,
      start,
      cliff,
      rate,
      vestingAdmin,
      unlock,
      transferLock
    );
    now = await time.increase(timeShift);
    // pull balances
    let adminBalances = await token.balanceOf(vestingAdmin);
    let vestorBalance = await token.balanceOf(a.address);

    let vestingBalances = C.calculateBalances(start, cliff, amount, rate, now + 1);
    let balance = vestingBalances.balance;
    let remainder = vestingBalances.remainder;
    if (remainder > 0) {
      expect(await streaming.revokeNFTs(['1']))
        .to.emit('NFTRevoked')
        .withArgs('1', balance, remainder);
      // contract should be empty, and remainder transferred to the admin
      expect(await token.balanceOf(streaming.address)).to.eq(0);
      expect(await token.balanceOf(vestingAdmin)).to.eq(adminBalances.add(remainder));
      if (unlock < now) {
        expect(await token.balanceOf(a.address)).to.eq(vestorBalance.add(balance));
      } else if (balance > 0) {
        if (transferLock) {
            expect(await token.balanceOf(transferLocker.address)).to.eq(balance);
            expect(await transferLocker.balanceOf(a.address)).to.eq(1);
            expect(await transferLocker.ownerOf('1')).to.eq(a.address);
            // check the struct
            const stream = await transferLocker.streams('1');
            expect(stream.amount).to.eq(balance);
            expect(stream.token).to.eq(token.address);
            expect(stream.start).to.eq(unlock);
            expect(stream.cliffDate).to.eq(unlock);
            expect(stream.rate).to.eq(balance);
        } else {
            expect(await token.balanceOf(noTransferLocker.address)).to.eq(balance);
            expect(await noTransferLocker.balanceOf(a.address)).to.eq(1);
            expect(await noTransferLocker.ownerOf('1')).to.eq(a.address);
            // check the struct
            const stream = await noTransferLocker.streams('1');
            expect(stream.amount).to.eq(balance);
            expect(stream.token).to.eq(token.address);
            expect(stream.start).to.eq(unlock);
            expect(stream.cliffDate).to.eq(unlock);
            expect(stream.rate).to.eq(balance);
        }
      }
      expect(await streaming.balanceOf(a.address)).to.eq(0);
      const revoked = await streaming.streams('1');
      expect(revoked.token).to.eq(C.ZERO_ADDRESS);
      expect(revoked.amount).to.eq(C.ZERO);
      expect(revoked.start).to.eq(C.ZERO);
      expect(revoked.rate).to.eq(C.ZERO);
      expect(revoked.vestingAdmin).to.eq(C.ZERO_ADDRESS);
      
    }
  });
};

const revokeErrorTests = () => {
    let s, streaming, creator, a, b, token, transferLocker, noTransferLocker;
    let amount, rate, start, cliff, vestingAdmin;
    it(`cannot be revoked if there is no remainder, ie fully vested`, async () => {
        s = await setupVesting();
    streaming = s.streaming;
    creator = s.creator;
    vestingAdmin = creator.address;
    a = s.a;
    b = s.b;
    token = s.token;
    transferLocker = s.transferLocker;
    noTransferLocker = s.noTransferLocker;
    let now = await time.latest();
    amount = C.E18_1;
    rate = C.E18_1;
    start = now - 10;
    cliff = start;
    await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, vestingAdmin);
    await expect(streaming.revokeNFTs(['1'])).to.be.revertedWith('SV10')
    });
    it(`cannot be revoked if it has already been revoked`, async () => {
        start = await time.latest() + 500;
        await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, vestingAdmin);
        await streaming.revokeNFTs(['2']);
        await expect(streaming.revokeNFTs(['2'])).to.be.reverted;
    });
    it(`will revert if a wallet that is not the admin tries to revoke`, async () => {
        
        await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, vestingAdmin);
        await expect(streaming.connect(a).revokeNFTs(['3'])).to.be.revertedWith('SV09');
    });
}


module.exports = {
    revokeTest,
    revokeErrorTests,
}