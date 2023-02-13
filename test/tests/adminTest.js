const { expect } = require('chai');
const { setupStreaming, setupVesting, setupBoundStreaming } = require('../fixtures');

module.exports = (vesting, bound) => {
  let streaming;
  it('deploys the contract and updates the base URI', async () => {
    let s;
    if (vesting == true) {
      s = await setupVesting();
    } else if (bound == true) {
      s = await setupBoundStreaming();
    } else {
      s = await setupStreaming();
    }
    streaming = s.streaming;
    let uri = `https://nft.hedgey.finance/ethers/${streaming.address}/`;
    expect(await streaming.updateBaseURI(uri))
      .to.emit('URISet')
      .withArgs(uri);
  });
  it('admin can update the base URI again', async () => {
    let uri = 'this_is_a_new_uri'
    expect(await streaming.updateBaseURI(uri))
    .to.emit('URISet')
      .withArgs(uri);
  });
  it('will fail if a non-admin calls the function', async () => {
    
  })
};
