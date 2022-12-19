const { expect } = require('chai');
const { setupStreaming } = require('./fixtures');

module.exports = () => {
  let creator, streaming;
  it('deploys the contract and updates the base URI', async () => {
    const s = await setupStreaming();
    creator = s.creator;
    streaming = s.streaming;
    expect(await streaming.updateBaseURI(`https://nft.hedgey.finance/ethers/${streaming.address}/`))
      .to.emit('URISet')
      .withArgs(`https://nft.hedgey.finance/ethers/${streaming.address}/`);
  });
  it('fails to change the baseURI again', async () => {
    await expect(streaming.updateBaseURI('https')).to.be.revertedWith('NFT02');
  });
};
