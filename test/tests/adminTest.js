const { expect } = require('chai');
const { setupStreaming, setupVesting } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');

module.exports = (vesting, bound) => {
  let streaming, s, uri, a, creator, token;
  it('deploys the contract and updates the base URI', async () => {
    s = vesting ? await setupVesting() : await setupStreaming(bound);
    a = s.a;
    creator = s.creator;
    token = s.token;
    streaming = s.streaming;
    uri = `https://nft.hedgey.finance/ethers/${streaming.address}/`;
    expect(await streaming.updateBaseURI(uri))
      .to.emit('URISet')
      .withArgs(uri);
  });
  it('admin can update the base URI again', async () => {
    uri = 'this_is_a_new_uri';
    expect(await streaming.updateBaseURI(uri))
      .to.emit('URISet')
      .withArgs(uri);
  });
  it('checks the uri of token id 1', async () => {
    let amount = C.E18_1;
    let rate = amount;
    let start = await time.latest();
    let cliff = start;
    let admin = creator.address;
    vesting
      ? await streaming.createNFT(a.address, token.address, amount, start, cliff, rate, admin)
      : await streaming.createNFT(a.address, token.address, amount, start, cliff, rate);
    expect(await streaming.tokenURI('1')).to.eq(`${uri}1`);
  });
  it('will fail if a non-admin updates the baseURI or tries to delete the admin', async () => {
    await expect(streaming.connect(a).updateBaseURI(uri)).to.be.revertedWith('SV01');
    await expect(streaming.connect(a).deleteAdmin()).to.be.revertedWith('SV01');
  });
  it('deletes the admin once with the uri set', async () => {
    expect(await streaming.deleteAdmin())
      .to.emit('AdminDeleted')
      .withArgs(creator.address);
  });
  it('reverts if the uri has not been set yet', async () => {
    s = vesting ? await setupVesting() : await setupStreaming(bound);
    streaming = s.streaming;
    await expect(streaming.deleteAdmin()).to.be.revertedWith('not set');
  });
};
