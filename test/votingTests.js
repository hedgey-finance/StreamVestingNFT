const { expect } = require('chai');
const { setupStreaming, setupVesting } = require('./fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('./constants');
const { BigNumber } = require('ethers');

/** This set of tests is to test the unique functionality of the contracts for recording locked token balances in aggregate
 * It should test if the locked balances function from the StreamLibrary and VestingLibrary work properly
 * So that we can see the token locked balances across a users entire owned NFTs
 * Secondarily this will test for the delegated locked balances, as described byt eh ERC721Delegate contract
 * It should be able to test that tokens minted have delegated those NFTs to the owner initially
 * and on transfer the delegation is changed to the new owner
 * and on burn the delegation is removed
 * and a user can Delegate to a secondary wallet - which will then be responsible for voting with those locked tokens
 * it should test that when a set of NFTs have been delegated to another wallet, if one of those NFTs is transferred the delegation is reset to the new owner and removed from the delegate
 */

const streamVotingTest = () => {
  let streaming, creator, a, b, c, token, usdc, batchStreamer;
  let amount, start, cliff, rate, end;
  it('When an NFT is minted the holder is the delegate', async () => {
    const s = await setupStreaming();
    streaming = s.streaming;
    batchStreamer = s.batchStreamer;
    creator = s.creator;
    a = s.a;
    b = s.b;
    c = s.c;
    token = s.token;
    usdc = s.usdc;
    amount = C.E18_100;
    rate = C.E18_1;
    start = await time.latest();
    cliff = start;
    end = start + amount.div(rate);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate))
      .to.emit('TokenDelegated')
      .withArgs('1', a.address);
    const lockedBalance = await streaming.lockedBalances(a.address, token.address);
    const delegatedBalance = await streaming.delegatedBalances(a.address, token.address);
    const delegatetokens = await streaming.balanceOfDelegate(a.address);
    const delegateTo = await streaming.delegatedTo('1');
    const tokenId = await streaming.tokenOfDelegateByIndex(a.address, '0');
    expect(lockedBalance).to.eq(amount);
    expect(delegatedBalance).to.eq(amount);
    expect(delegatetokens).to.eq('1');
    expect(delegateTo).to.eq(a.address);
    expect(tokenId).to.eq('1');
  });
  it('mints another NFT and the balance is added to the aggregate for same wallet', async () => {
    const newToken = '2';
    amount = C.E18_50;
    const total = amount.add(C.E18_100);
    expect(await streaming.createNFT(a.address, token.address, amount, start, cliff, rate))
      .to.emit('TokenDelegated')
      .withArgs(newToken, a.address);
    const lockedBalance = await streaming.lockedBalances(a.address, token.address);
    const delegatedBalance = await streaming.delegatedBalances(a.address, token.address);
    const delegatetokens = await streaming.balanceOfDelegate(a.address);
    const delegateTo = await streaming.delegatedTo(newToken);
    const tokenId = await streaming.tokenOfDelegateByIndex(a.address, '1');
    expect(lockedBalance).to.eq(total);
    expect(delegatedBalance).to.eq(total);
    expect(delegatetokens).to.eq('2');
    expect(delegateTo).to.eq(a.address);
    expect(tokenId).to.eq(newToken);
  });
  it('delegates a single token to another address', async () => {
    const id = '2';
    const stream = await streaming.streams(id);
    const lockedAmount = stream.amount;
    const total = amount.add(C.E18_100);

    expect(await streaming.connect(a).delegateToken(b.address, id))
      .to.emit('TokenDelegated')
      .withArgs(id, b.address);

    const b_Balance = await streaming.lockedBalances(b.address, token.address);
    expect(b_Balance).to.eq(0);
    const bDelegateBalance = await streaming.delegatedBalances(b.address, token.address);
    expect(bDelegateBalance).to.eq(lockedAmount);
    const delegateTokens = await streaming.balanceOfDelegate(b.address);
    expect(delegateTokens).to.eq('1');
    const delegatedTo = await streaming.delegatedTo(id);
    expect(delegatedTo).to.eq(b.address);
    const tokenId = await streaming.tokenOfDelegateByIndex(b.address, '0');
    expect(tokenId).to.eq(id);

    const aLockedBalance = await streaming.lockedBalances(a.address, token.address);
    expect(aLockedBalance).to.eq(total);
    const aDelegateBalance = await streaming.delegatedBalances(a.address, token.address);
    expect(aDelegateBalance).to.eq(C.E18_100);
    const aDelegateTokens = await streaming.balanceOfDelegate(a.address);
    expect(aDelegateTokens).to.eq('1');
  });
  it('Wallet A delegates the token 2 back to itself', async () => {
    const id = '2';
    expect(await streaming.connect(a).delegateToken(a.address, id))
      .to.emit('TokenDelegated')
      .withArgs(id, a.address);
    const lockedBalance = await streaming.lockedBalances(a.address, token.address);
    const delegatedBalance = await streaming.delegatedBalances(a.address, token.address);
    expect(lockedBalance).to.eq(delegatedBalance);
    const bDelegateBalance = await streaming.delegatedBalances(b.address, token.address);
    expect(bDelegateBalance).to.eq(0);

    const delegateBalanceOfA = await streaming.balanceOfDelegate(a.address);
    expect(delegateBalanceOfA).to.eq(2);
    // for (let i = 0; i < delegateBalanceOfA; i++) {
    //   let tokenId = await streaming.tokenOfDelegateByIndex(a.address, i);
    //   console.log(`the tokenId at index ${i} is: ${tokenId}`);
    //   alist.push(tokenId);
    // }
    // console.log(`the list of tokens in A is ${alist}`);
  });
  it('Mints several more tokens to wallet A and it transfers some to B and delegates some to C', async () => {
    const priorAmount = await streaming.lockedBalances(a.address, token.address);
    const amounts = [C.E18_10, C.E18_10, C.E18_12, C.E18_10, C.E18_50];
    let additionalAmount = C.ZERO;
    for (let i = 0; i < amounts.length; i++) {
      additionalAmount = additionalAmount.add(amounts[i]);
      await streaming.createNFT(a.address, token.address, amounts[i], start, cliff, rate);
    }

    // wallet A should now hav 7 tokens
    const aBalanceOf = await streaming.balanceOf(a.address);
    expect(aBalanceOf).to.eq(7);
    let newLockedBalance = additionalAmount.add(priorAmount);
    const lockedBalance = await streaming.lockedBalances(a.address, token.address);
    expect(lockedBalance).to.eq(newLockedBalance);

    const delegateABalance = await streaming.delegatedBalances(a.address, token.address);
    expect(delegateABalance).to.eq(lockedBalance);

    //ids to transfer
    const b1 = '4';
    const b1Amount = (await streaming.streams(b1)).amount;
    const b2 = '6';
    const b2Amount = (await streaming.streams(b2)).amount;
    const c1 = '1';
    const c1Amount = (await streaming.streams(c1)).amount;
    expect(await streaming.connect(a).transferFrom(a.address, b.address, b1))
      .to.emit('TokenDelegated')
      .withArgs(b1, b.address);
    expect(await streaming.connect(a).transferFrom(a.address, b.address, b2))
      .to.emit('TokenDelegated')
      .withArgs(b2, b.address);
    expect(await streaming.connect(a).transferFrom(a.address, c.address, c1))
      .to.emit('TokenDelegated')
      .withArgs(c1, c.address);

    // // check the locked balances
    const lockedBalanceA = await streaming.lockedBalances(a.address, token.address);
    const lockedBalanceB = await streaming.lockedBalances(b.address, token.address);
    const lockedBalanceC = await streaming.lockedBalances(c.address, token.address);
    let newABalance = lockedBalance.sub(b1Amount).sub(b2Amount).sub(c1Amount);
    expect(lockedBalanceA).to.eq(newABalance);
    expect(lockedBalanceB).to.eq(b1Amount.add(b2Amount));
    expect(lockedBalanceC).to.eq(c1Amount);

    // // check the delegated balances

    expect(await streaming.delegatedTo(b1)).to.eq(b.address);
    expect(await streaming.delegatedTo(b2)).to.eq(b.address);
    expect(await streaming.delegatedTo(c1)).to.eq(c.address);

    let delegatdBalanceA = await streaming.delegatedBalances(a.address, token.address);
    let delegatdBalanceB = await streaming.delegatedBalances(b.address, token.address);
    let delegatdBalanceC = await streaming.delegatedBalances(c.address, token.address);
    let newADelegateBalance = delegateABalance.sub(b1Amount).sub(b2Amount).sub(c1Amount);
    expect(delegatdBalanceA).to.eq(newADelegateBalance);
    expect(delegatdBalanceB).to.eq(b1Amount.add(b2Amount));
    expect(delegatdBalanceC).to.eq(c1Amount);

    // ids to delegate
    const c2 = '3';
    const c2Amount = (await streaming.streams(c2)).amount;
    expect(await streaming.connect(a).delegateToken(c.address, c2))
      .to.emit('TokenDelegated')
      .withArgs(c2, c.address);
    delegatdBalanceA = await streaming.delegatedBalances(a.address, token.address);
    delegatdBalanceC = await streaming.delegatedBalances(c.address, token.address);
    expect(delegatdBalanceA).to.eq(newADelegateBalance.sub(c2Amount));
    expect(delegatdBalanceC).to.eq(c1Amount.add(c2Amount));
  });
  it('Wallet A delegates all tokens to creator address', async () => {
    // pull all of the currently owned tokens of A
    const balanceOfA = await streaming.balanceOf(a.address);
    for (let i = 0; i < balanceOfA; i++) {
        let tokenId = await streaming.tokenOfOwnerByIndex(a.address, i);
    }
  })
};

module.exports = {
  streamVotingTest,
};
