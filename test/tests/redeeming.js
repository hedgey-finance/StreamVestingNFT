const { expect } = require('chai');
const { peMintedVesting, preMintedStreaming } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');
const { ethers } = require('hardhat');

/** Redeeming Tests need to:
 * 1. Test redeeming an NFT after the start, cliff and unlock date
 *   - check that the calcualted balance matches what the user receives
 *   - check that amount in the struct is updated and the start date is updated to block time
 *   - check that the new calcualted balance after the redemption is correct
 *   - move forward in time and check the new calculated balances is correct
 *   - checkt that NFT can be redeemed multiple times until fully vested
 *   - check that it will be fully redeemed on the end date
 *   - check that the balance of the contract and wallet is correct after each redemption
 *   - check that after full redemption the struct is deleted, and balance fully removed and delivered to holder
 * 2. Test redeeming multiple NFTs with the above checks (both of same token and of various tokens)
 * 3. Test redeeming all of my NFTs with various tokens locked inside with the above checks
 *    - additional check that tokens with nothing to claim (ie balance is 0) are not redeemed
 * 4. For StreamingHedgeys ONLY - test the redeemAndTransfer function
 *   - check the updated balances and calculation
 *   - check that the new owner of the NFT can redeem
 *   - error test: that it cannot be transferred if there is no remainder
 *   - error test: it cannot be transferred if the msg.sender is not the owner of the NFT
 * 5. Error tests:
 *   - check that the redeemer must be the owner of the NFT
 *   - check that the NFT must have a balance in order to redeem
 *   - check that the NFT cannot be redeemed after it has been fully redeemed
 *
 */

const redeemTest = (vesting, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, token, usdc, tokenId;
  let amount, now, start, cliff, rate, admin, unlock, transferLock, timeShift;
  it(`Redeems a ${vesting ? 'vesting' : 'streaming'} NFT`, async () => {
    s = vesting
      ? await peMintedVesting(amountParams, timeParams)
      : await preMintedStreaming(bound, amountParams, timeParams);
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    usdc = s.usdc;
    tokenId = 2;
    // should return with a streaming NFT contract with several NFT's minted. we just test redeeming the first one
    const ownerOf = await streaming.ownerOf(tokenId);
    const owner = ownerOf == a.address ? a : b;
    // check if we have passed the start and date
    const end = await streaming.getStreamEnd(tokenId);
    const start = (await streaming.streams(tokenId)).start;
    const cliff = (await streaming.streams(tokenId)).cliffDate;
    const amount = (await streaming.streams(tokenId)).amount;
    const rate = (await streaming.streams(tokenId)).rate;
    const lockedTokenAddress = (await streaming.streams(tokenId)).token;
    const lockedToken = lockedTokenAddress == token.address ? token : usdc;
    const unlock = vesting ? (await streaming.streams(tokenId)).unlockDate : 0;
    // make a duplicate NFT for final test
    const duplicate = vesting
      ? await streaming.createLockedNFT(
          ownerOf,
          lockedTokenAddress,
          amount,
          start,
          cliff,
          rate,
          creator.address,
          unlock,
          true
        )
      : await streaming.createNFT(ownerOf, lockedTokenAddress, amount, start, cliff, rate);
    const dupTokenId = (await duplicate.wait()).events[4].args.id;
    let now = await time.latest();
    if (start > now || cliff > now || unlock > now) {
      expect((await streaming.streamBalanceOf(tokenId)).balance).to.eq(0);
      let maxTime = Math.max(start, cliff, unlock);
      let timeMove = maxTime - now;
      await time.increase(timeMove);
    }
    /// we should be at least at the start or the cliff start so we can test redemption
    now = await time.increase(timeParams.timeShift);
    //check calcualted balances vs streaming balances
    let streamingBalances = await streaming.streamBalanceOf(tokenId);
    let calcBalances = C.calculateBalances(start, cliff, amount, rate, now);
    expect(streamingBalances.balance).to.eq(calcBalances.balance);
    expect(streamingBalances.remainder).to.eq(calcBalances.remainder);
    if (now > end) {
      // the entire nft should be redeemed, check that the amount == balance and remainder == 0
      expect(streamingBalances.balance).to.eq(amount);
      expect(streamingBalances.remainder).to.eq(0);
      const tokenBalanceOfContract = await lockedToken.balanceOf(streaming.address);
      const ownerBalance = await lockedToken.balanceOf(ownerOf);
      expect(await streaming.connect(owner).redeemNFT([tokenId]))
        .to.emit('NFTRedeemed')
        .withArgs(tokenId, amount, 0);
      const afterTokenBalanceofContract = await lockedToken.balanceOf(streaming.address);
      const afterOwnerBalance = await lockedToken.balanceOf(ownerOf);
      expect(afterTokenBalanceofContract).to.eq(tokenBalanceOfContract.sub(amount));
      expect(afterOwnerBalance).to.eq(ownerBalance.add(amount));
      ///chec the NFT can't be redeemed again
      await expect(streaming.connect(owner).redeemNFT([tokenId])).to.be.reverted;
      await expect(streaming.ownerOf(tokenId)).to.be.reverted;
      expect((await streaming.streams(tokenId)).amount).to.eq(0);
      expect((await streaming.streams(tokenId)).rate).to.eq(0);
      expect((await streaming.streams(tokenId)).start).to.eq(0);
      expect((await streaming.streams(tokenId)).cliffDate).to.eq(0);
      expect((await streaming.streams(tokenId)).token).to.eq(C.ZERO_ADDRESS);
    } else {
      // partial redemption 1
      const tokenBalanceOfContract = await lockedToken.balanceOf(streaming.address);
      const ownerBalance = await lockedToken.balanceOf(ownerOf);
      const remainder = streamingBalances.remainder;
      const priorBalance = streamingBalances.balance;
      expect(await streaming.connect(owner).redeemNFT([tokenId]))
        .to.emit('NFTRedeemed')
        .withArgs(tokenId, streamingBalances.balance, remainder);
      const afterTokenBalanceofContract = await lockedToken.balanceOf(streaming.address);
      const afterOwnerBalance = await lockedToken.balanceOf(ownerOf);
      expect(afterTokenBalanceofContract).to.eq(tokenBalanceOfContract.sub(priorBalance));
      expect(afterOwnerBalance).to.eq(ownerBalance.add(priorBalance));
      // calculate the balances with the new time of now with the amount being the streamingBalances.remainder
      let currTime = await time.latest();
      calcBalances = C.calculateBalances(now, cliff, remainder, rate, currTime);
      streamingBalances = await streaming.streamBalanceOf(tokenId);
      expect(streamingBalances.balance).to.eq(calcBalances.balance);
      expect(streamingBalances.remainder).to.eq(calcBalances.remainder);
      // check the struct and owner of is still intact
      expect(await streaming.ownerOf(tokenId)).to.eq(owner.address);
      expect((await streaming.streams(tokenId)).amount).to.eq(remainder);
      expect((await streaming.streams(tokenId)).rate).to.eq(rate);
      expect((await streaming.streams(tokenId)).start).to.eq(now);
      expect((await streaming.streams(tokenId)).cliffDate).to.eq(cliff);
      expect((await streaming.streams(tokenId)).token).to.eq(lockedToken.address);

      // progress forward we want to check that redeeming at the future time would have the equivalent total redemption as if the user waited
      // ie redeem(t=0) + redeem(t=1) == redeem(t=1) so to test we use duplicate token to test at t=0 and t=1 for both
      let nowTime = await time.increase(timeParams.timeShift);
      // compare balances
      const tokenBalances = await streaming.streamBalanceOf(tokenId);
      const duplicateBalances = await streaming.streamBalanceOf(dupTokenId);
      // remainders should be the same
      expect(tokenBalances.remainder).to.eq(duplicateBalances.remainder);
      // balances from the duplicate should be the same as the prior redeemed balance plus the updated balance
      expect(duplicateBalances.balance).to.eq(priorBalance.add(tokenBalances.balance));

      // check that both can be redeemed again
      expect(await streaming.connect(owner).redeemNFT(tokenId)).to.emit('NFTRedeemed').withArgs(tokenId, tokenBalances.balance, tokenBalances.remainder);
      expect(await streaming.connect(owner).redeemNFT(dupTokenId)).to.emiw('NFTRedeemed').withArgs(dupTokenId, duplicateBalances.balance, duplicateBalances.remainder);
      // user should hold double the balances of each tokens total redemption amounts
      const ownerPostBalance = await lockedToken.balanceOf(owner.address);
      expect(ownerPostBalance).to.eq(duplicateBalances.balance.mul(2));
      expect(ownerPostBalance).to.eq(duplicateBalances.balance.add(priorBalance.add(tokenBalances.balance)));
    }
  });
};

const reedeemMulitpleTest = (vesting, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, c, token;
  let amount, now, start, cliff, rate, admin, unlock, transferLock, timeShift;
  it(`redeems multiple NFTs with various redemption params`, async () => {
    s = vesting
      ? await peMintedVesting(amountParams, timeParams)
      : await preMintedStreaming(bound, amountParams, timeParams);
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    usdc = s.usdc;
    // owner A should be the owner of all the tokens
  })
};

const redeemAllTest = (vesting, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, c, token;
  let amount, now, start, cliff, rate, admin, unlock, transferLock, timeShift;
  it(`redeems all of the NFTs with wallet A owns even if not vested yet`, async () => {
    s = vesting
      ? await peMintedVesting(amountParams, timeParams)
      : await preMintedStreaming(bound, amountParams, timeParams);
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    usdc = s.usdc;
    // owner A should be the owner of all the tokens
  })
};

const transferAndRedeemTest = (vesting, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, c, token;
  let amount, now, start, cliff, rate, admin, unlock, transferLock, timeShift;
  it(`redeems and transfer an NFT with a remainder, and fails when there is no remainder`, async () => {
    s = vesting
      ? await peMintedVesting(amountParams, timeParams)
      : await preMintedStreaming(bound, amountParams, timeParams);
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    usdc = s.usdc;
  })
};

const redeemErrorTests = (vesting, bound) => {
  let s, streaming, creator, a, b, c, token;
  let amount, now, start, cliff, rate, admin, unlock, transferLock, timeShift;
  it(`will revert if the NFT has been redeemed`, async () => {

  });
  it(`will revert if the NFT doesn't have a balance to redeem`, async () => {

  });
  it(`will revert if the caller of the function is not the owner of the NFT`, async () => {

  });
  it(`will revert if the NFT has been revoked for the vesting NFTs`, async () => {
    
  })
};

module.exports = {
  redeemTest,
};
