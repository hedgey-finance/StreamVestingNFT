const { expect } = require('chai');
const { setupStreaming, setupVesting } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');
const { ethers } = require('hardhat');

module.exports = (vesting) => {
  let s, streaming, creator, a, token;
  it('reverts if the vesting or bound hedgeys NFT is transferred', async () => {
    s = vesting ? await setupVesting() : await setupStreaming(true);
    now = await time.latest();
    streaming = s.streaming;
    creator = s.creator;
    a = s.a;
    token = s.token.address;
    let amount = C.E18_100;
    let rate = C.E18_1;
    let start = await time.latest();
    let cliff = '0';
    let admin = creator.address;
    if (vesting) {
      await streaming.createNFT(a.address, token, amount, start, cliff, rate, admin);
    } else {
      await streaming.createNFT(a.address, token, amount, start, cliff, rate);
    }
    await expect(streaming.connect(a).transferFrom(a.address, creator.address, '1')).to.be.revertedWith('Not transferrable');
  });
};
