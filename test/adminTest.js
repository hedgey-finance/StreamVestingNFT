const { expect } = require('chai');
const { setupStreaming, setupVesting } = require('./fixtures');

module.exports = () => {
  let streaming, vesting;
  it('deploys the contract and updates the base URI', async () => {
    const s = await setupStreaming();
    streaming = s.streaming;
    expect(await streaming.updateBaseURI(`https://nft.hedgey.finance/ethers/${streaming.address}/`))
      .to.emit('URISet')
      .withArgs(`https://nft.hedgey.finance/ethers/${streaming.address}/`);
  });
  it('fails to change the baseURI again', async () => {
    await expect(streaming.updateBaseURI('https')).to.be.revertedWith('NFT02');
  });
  it('deploys the vesting contract and updates the base URI', async () => {
    const v = await setupVesting();
    vesting = v.vesting;
    expect(await vesting.updateBaseURI(`https://nft.hedgey.finance/ethers/${vesting.address}/`))
      .to.emit('URISet')
      .withArgs(`https://nft.hedgey.finance/ethers/${vesting.address}/`);
  });
  it('fails to change the baseURI again', async () => {
    await expect(vesting.updateBaseURI('https')).to.be.revertedWith('NFT02');
  });
};
