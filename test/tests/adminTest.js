const { expect } = require('chai');
const { setupStreaming, setupVesting, setupBoundStreaming } = require('../fixtures');

module.exports = (vesting, bound) => {
  let streaming, s, uri, a;
  it('deploys the contract and updates the base URI', async () => {
    if (vesting == true) {
      s = await setupVesting();
    } else if (bound == true) {
      s = await setupBoundStreaming();
    } else {
      s = await setupStreaming();
    }
    a = s.a;
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
  it('will fail if a non-admin calls the function', async () => {
    await expect(streaming.connect(a).updateBaseURI(uri)).to.be.revertedWith('SV01');
  });
  it('Admin will delete itself from the contract', async () => {
    expect(await streaming.deleteAdmin());
    await expect(streaming.updateBaseURI(uri)).to.be.revertedWith('SV01');
  });
};
