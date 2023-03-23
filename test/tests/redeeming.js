const { expect } = require('chai');
const { peMintedVesting, preMintedStreaming, setupStreaming, setupVesting } = require('../fixtures');
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
    if (now >= end) {
      let timeStamp = (await time.latest()) + 1;
      // the entire nft should be redeemed, check that the amount == balance and remainder == 0
      expect(streamingBalances.balance).to.eq(amount);
      expect(streamingBalances.remainder).to.eq(0);
      const tokenBalanceOfContract = await lockedToken.balanceOf(streaming.address);
      const ownerBalance = await lockedToken.balanceOf(ownerOf);
      expect(await streaming.connect(owner).redeemNFTs([tokenId]))
        .to.emit('NFTRedeemed')
        .withArgs(tokenId, amount, 0, timeStamp);
      const afterTokenBalanceofContract = await lockedToken.balanceOf(streaming.address);
      const afterOwnerBalance = await lockedToken.balanceOf(ownerOf);
      expect(afterTokenBalanceofContract).to.eq(tokenBalanceOfContract.sub(amount));
      expect(afterOwnerBalance).to.eq(ownerBalance.add(amount));

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
      const checkPointTime = (await time.latest()) + 1;
      const balanceCheckpoint = C.calculateBalances(start, cliff, amount, rate, checkPointTime);
      const remainder = balanceCheckpoint.remainder;
      const priorBalance = balanceCheckpoint.balance;
      expect(await streaming.connect(owner).redeemNFTs([tokenId]))
        .to.emit('NFTRedeemed')
        .withArgs(tokenId, streamingBalances.balance, remainder, checkPointTime);
      const afterTokenBalanceofContract = await lockedToken.balanceOf(streaming.address);
      const afterOwnerBalance = await lockedToken.balanceOf(ownerOf);
      expect(afterTokenBalanceofContract).to.eq(tokenBalanceOfContract.sub(priorBalance));
      expect(afterOwnerBalance).to.eq(ownerBalance.add(priorBalance));
      // calculate the balances with the new time of now with the amount being the streamingBalances.remainder
      let currTime = await time.latest();
      calcBalances = C.calculateBalances(checkPointTime, cliff, remainder, rate, currTime);
      streamingBalances = await streaming.streamBalanceOf(tokenId);
      expect(streamingBalances.balance).to.eq(calcBalances.balance);
      expect(streamingBalances.remainder).to.eq(calcBalances.remainder);
      // check the struct and owner of is still intact
      expect(await streaming.ownerOf(tokenId)).to.eq(owner.address);
      expect((await streaming.streams(tokenId)).amount).to.eq(remainder);
      expect((await streaming.streams(tokenId)).rate).to.eq(rate);
      expect((await streaming.streams(tokenId)).start).to.eq(checkPointTime);
      expect((await streaming.streams(tokenId)).cliffDate).to.eq(cliff);
      expect((await streaming.streams(tokenId)).token).to.eq(lockedToken.address);

      // progress forward we want to check that redeeming at the future time would have the equivalent total redemption as if the user waited
      // ie redeem(t=0) + redeem(t=1) == redeem(t=1) so to test we use duplicate token to test at t=0 and t=1 for both
      await time.increase(timeParams.timeShift);
      let timeStamp = (await time.latest()) + 1;
      // compare balances
      const tokenBalances = await streaming.streamBalanceOf(tokenId);
      let duplicateBalances = await streaming.streamBalanceOf(dupTokenId);
      // remainders should be the same
      expect(tokenBalances.remainder).to.eq(duplicateBalances.remainder);
      // balances from the duplicate should be the same as the prior redeemed balance plus the updated balance
      expect(duplicateBalances.balance).to.eq(priorBalance.add(tokenBalances.balance));

      // check that both can be redeemed again
      expect(await streaming.connect(owner).redeemNFTs([tokenId]))
        .to.emit('NFTRedeemed')
        .withArgs(tokenId, tokenBalances.balance, tokenBalances.remainder, timeStamp);
      expect(await streaming.connect(owner).redeemNFTs([dupTokenId]))
        .to.emit('NFTRedeemed')
        .withArgs(dupTokenId, duplicateBalances.balance, duplicateBalances.remainder, timeStamp);
    }
  });
};

const reedeemMulitpleTest = (vesting, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, c, token;
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
    const balanceOfA = await streaming.balanceOf(a.address);
    let now = await time.increase(timeParams.timeShift);
    let tokens = [];
    for (let i = 0; i < balanceOfA; i++) {
      let tokenId = await streaming.tokenOfOwnerByIndex(a.address, i);
      let start = (await streaming.streams(tokenId)).start;
      let cliff = (await streaming.streams(tokenId)).cliffDate;
      let unlock = vesting ? (await streaming.streams(i)).unlockDate : 0;
      if (now > Math.max(start, cliff, unlock)) tokens.push(tokenId);
    }
    const tx = await streaming.connect(a).redeemNFTs(tokens);
    for (let i = 0; i < balanceOfA; i++) {
      expect(await tx).to.emit('NFTRedeemed');
    }
  });
};

const redeemAllTest = (vesting, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, c, token;
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
    const balanceOfA = await streaming.balanceOf(a.address);
    let now = await time.increase(timeParams.timeShift);
    let tokens = [];
    let balances = [];
    let remainders = [];
    const preTokenBalance = await token.balanceOf(streaming.address);
    const preUSDCBalance = await usdc.balanceOf(streaming.address);
    let usdcBalance = C.ZERO;
    let tokenBalance = C.ZERO;
    for (let i = 0; i < balanceOfA; i++) {
      let tokenId = await streaming.tokenOfOwnerByIndex(a.address, i);
      let stream = await streaming.streams(tokenId);
      let streamBalance = C.calculateBalances(stream.start, stream.cliffDate, stream.amount, stream.rate, now + 1);
      let balance = streamBalance.balance;
      let remainder = streamBalance.remainder;
      let lockedToken = (await streaming.streams(tokenId)).token;
      if (balance > 0) {
        tokens.push(tokenId);
        balances.push(balance);
        remainders.push(remainder);
        if (lockedToken == token.address) {
          tokenBalance = tokenBalance.add(balance);
        } else {
          usdcBalance = usdcBalance.add(balance);
        }
      }
    }
    let timeStamp = (await time.latest()) + 1;
    const tx = await streaming.connect(a).redeemAllNFTs();
    for (let i = 0; i < tokens.length; i++) {
      expect(tx).to.emit('NFTRedeemed').withArgs(tokens[i], balances[i], remainders[i], timeStamp);
    }

    const postTokenBalance = await token.balanceOf(streaming.address);
    const postUSDCBalance = await usdc.balanceOf(streaming.address);
    expect(postTokenBalance).to.eq(preTokenBalance.sub(tokenBalance));
    expect(postUSDCBalance).to.eq(preUSDCBalance.sub(usdcBalance));
  });
};

const transferAndRedeemTest = (amountParams, timeParams) => {
  let s, streaming, creator, a, b, c, token;
  let amount, now, start, cliff, rate, admin, unlock, transferLock, timeShift;
  it(`redeems and transfer an NFT with a remainder`, async () => {
    s = await preMintedStreaming(false, amountParams, timeParams);
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    usdc = s.usdc;
    const balanceOfA = await streaming.balanceOf(a.address);
    now = await time.increase(timeParams.timeShift);

    // find a token with a remainder
    let tokenId = 0;
    for (let i = 0; i < balanceOfA; i++) {
      let testId = await streaming.tokenOfOwnerByIndex(a.address, i);
      let remainder = (await streaming.streamBalanceOf(testId)).remainder;
      let balance = (await streaming.streamBalanceOf(testId)).balance;
      if (remainder > 0 && balance > 0) {
        tokenId = testId;
        break;
      }
    }
    if (tokenId > 0) {
      expect(await streaming.connect(a).redeemAndTransfer(tokenId, b.address))
        .to.emit('NFTRedeemed')
        .to.emit('Transfer');
      const balanceOfB = await streaming.balanceOf(b.address);
      expect(balanceOfB).to.eq(1);
      expect(await streaming.ownerOf(tokenId)).to.eq(b.address);
      await time.increase(5);
      expect(await streaming.connect(b).redeemNFTs([tokenId])).to.emit('NFTRedeemed');
    }
  });
  it(`fails to redeem and transfer if there is no remainder`, async () => {
    now = await time.latest();
    let start = now - 10;
    let cliff = start;
    let amount = C.E18_1;
    let rate = C.E18_1;
    await streaming.createNFT(a.address, token.address, amount, start, cliff, rate);
    const balanceOfA = await streaming.balanceOf(a.address);
    const tokenId = await streaming.tokenOfOwnerByIndex(a.address, balanceOfA.sub(1));
    await expect(streaming.connect(a).redeemAndTransfer(tokenId, b.address)).to.be.revertedWith('SV11');
  });
  it(`fails to transfer if the balance is 0`, async () => {
    now = await time.latest();
    let start = now + 1000;
    let cliff = start;
    let amount = C.E18_1;
    let rate = C.E18_1;
    await streaming.createNFT(a.address, token.address, amount, start, cliff, rate);
    const balanceOfA = await streaming.balanceOf(a.address);
    const tokenId = await streaming.tokenOfOwnerByIndex(a.address, balanceOfA.sub(1));
    await expect(streaming.connect(a).redeemAndTransfer(tokenId, b.address)).to.be.revertedWith('SV08');
  });
};

const redeemErrorTests = (vesting, bound) => {
  let s, streaming, creator, a, b, c, token;
  let amount, now, start, cliff, rate, admin, unlock, transferLock;
  it(`will skip the redeem if the NFT has already been redeemed`, async () => {
    s = vesting ? await setupVesting() : await setupStreaming(bound);
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    usdc = s.usdc;
    amount = C.E18_1;
    rate = C.E18_05;
    now = await time.latest();
    start = now - 10;
    cliff = start;
    admin = creator.address;
    unlock = cliff;
    transferLock = false;
    const tx = vesting
      ? await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, creator.address)
      : await streaming.createNFT(a.address, token.address, amount, start, cliff, rate);
    //process redemption
    await streaming.connect(a).redeemNFTs(['1']);
    const retry = await streaming.connect(a).redeemNFTs(['1']);
    const events = (await retry.wait()).events;
    // test that on the rety the redemption internal event is entirely skipped and nothing processed
    expect(events.length).to.eq(0);
  });
  it(`will skip redemption if the NFT doesn't have a balance to redeem`, async () => {
    start = now + 1000;
    const tx = vesting
      ? await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, creator.address)
      : await streaming.createNFT(a.address, token.address, amount, start, cliff, rate);
    //process redemption
    const retry = await streaming.connect(a).redeemNFTs(['2']);
    const events = (await retry.wait()).events;
    expect(events.length).to.eq(0);
  });
  it(`will revert if the caller of the function is not the owner of the NFT`, async () => {
    start = await time.latest();
    const tx = vesting
      ? await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, creator.address)
      : await streaming.createNFT(a.address, token.address, amount, start, cliff, rate);
    await expect(streaming.redeemNFTs(['3'])).to.be.revertedWith('SV06');
  });
  it(`will revert if the NFT has been revoked for the vesting NFTs`, async () => {
    if (vesting) {
      start = (await time.latest()) - 50;
      amount = C.E18_1000;
      cliff = start;
      rate = C.E18_1;
      await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, creator.address);
      await streaming.revokeNFTs(['4']);
      const retry = await streaming.connect(a).redeemNFTs(['4']);
      const events = (await retry.wait()).events;
      expect(events.length).to.eq(0);
    }
  });
  it(`will skip redemption if the Vesting NFT unlock date is in the future`, async () => {
    if (vesting) {
      start = await time.latest();
      cliff = start;
      unlock = now + 100;
      amount= C.E18_100;
      rate = C.E18_1;
      await streaming.createLockedNFT(
        a.address,
        token.address,
        amount,
        start,
        cliff,
        rate,
        creator.address,
        unlock,
        true
      );
      await time.increase(50);
      const retry = await streaming.connect(a).redeemNFTs(['5']);
      const events = (await retry.wait()).events;
      expect(events.length).to.eq(0);
    }
  });
};

module.exports = {
  redeemTest,
  reedeemMulitpleTest,
  redeemAllTest,
  transferAndRedeemTest,
  redeemErrorTests,
};
