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
    let streaming, creator, a, b, c, token, usdc;
  let amount, start, cliff, rate, end;
  it('When an NFT is minted the holder is the delegate', async () => {
    const s = await setupStreaming();
    streaming = s.streaming;
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
    expect(await streaming.delegateToken(b.address, id)).to.emit('TokenDelegated').withArgs(id, b.address);
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
  })
}


module.exports = {
    streamVotingTest,
}