const { expect } = require('chai');
const { setupStreaming, setupBoundStreaming, setupVesting } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

const batchTests = (vesting, locked, bound, amountParams, timeParams) => {
  let s, streaming, creator, a, b, token, batcher;

  it(`Batch mints ${amountParams.amounts.length} on the ${
    vesting ? 'vesting' : 'streaming'
  } batch minter contract without mint type`, async () => {
    if (vesting == true) {
      s = await setupVesting();
    } else if (bound == true) {
      s = await setupBoundStreaming();
    } else {
      s = await setupStreaming();
    }
    streaming = s.streaming;
    batcher = s.batchStreamer;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    let totalAmount = C.ZERO;
    let now = await time.latest();
    let recipients = [];
    let starts = [];
    let cliffs = [];
    let unlocks = [];
    let transferLocker = true;
    let ends = [];
    const priorStreamBalance = await token.balanceOf(streaming.address);
    for (let i = 0; i < amountParams.amounts.length; i++) {
      recipients.push(a.address);
      totalAmount = totalAmount.add(amountParams.amounts[i]);
      starts.push(timeParams.starts[i] + now);
      cliffs.push(timeParams.cliffs[i] + now);
      unlocks.push(timeParams.unlocks[i] + now);
      let end = amountParams.amounts[i] / amountParams.rates[i] + starts[i];
      end += amountParams.amounts[i] % amountParams.rates[i] ? 0 : 1;
      ends.push(end);
    }
    if (vesting) {
      if (locked) {
        const tx = await batcher[
          'createLockedBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256[],bool)'
        ](
          streaming.address,
          recipients,
          token.address,
          amountParams.amounts,
          starts,
          cliffs,
          amountParams.rates,
          creator.address,
          unlocks,
          transferLocker
        );
        for (let i = 0; i < amountParams.amounts.length; i++) {
          expect(tx)
            .to.emit('NFTCreated')
            .withArgs(
              i + 1,
              recipients[i],
              token.address,
              amountParams.amounts[i],
              starts[i],
              cliffs[i],
              ends[i],
              amountParams.rates[i],
              creator.address,
              unlocks[i],
              transferLocker
            );
        }
      } else {
        const tx = await batcher[
          'createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address)'
        ](
          streaming.address,
          recipients,
          token.address,
          amountParams.amounts,
          starts,
          cliffs,
          amountParams.rates,
          creator.address
        );
        for (let i = 0; i < amountParams.amounts.length; i++) {
          expect(tx)
            .to.emit('NFTCreated')
            .withArgs(
              i + 1,
              recipients[i],
              token.address,
              amountParams.amounts[i],
              starts[i],
              cliffs[i],
              ends[i],
              amountParams.rates[i],
              creator.address,
              '0',
              false
            );
        }
      }
    } else {
      const tx = await batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[])'](
        streaming.address,
        recipients,
        token.address,
        amountParams.amounts,
        starts,
        cliffs,
        amountParams.rates
      );
      for (let i = 0; i < amountParams.amounts.length; i++) {
        expect(tx)
          .to.emit('NFTCreated')
          .withArgs(
            i + 1,
            recipients[i],
            token.address,
            amountParams.amounts[i],
            starts[i],
            cliffs[i],
            ends[i],
            amountParams.rates[i]
          );
      }
    }
    expect(await token.balanceOf(streaming.address)).to.eq(totalAmount.add(priorStreamBalance));
    expect(await streaming.balanceOf(a.address)).to.eq(amountParams.amounts.length);
    expect(await streaming.lockedBalances(a.address, token.address)).to.eq(totalAmount.add(priorStreamBalance));
  });
  it(`Batch mints ${amountParams.amounts.length} on the ${
    vesting ? 'vesting' : 'streaming'
  } batch minter contract with mint type`, async () => {
    let totalAmount = C.ZERO;
    let now = await time.latest();
    let recipients = [];
    let starts = [];
    let cliffs = [];
    let unlocks = [];
    let transferLocker = true;
    let ends = [];
    const priorStreamBalance = await token.balanceOf(streaming.address);
    const mintType = '65';
    for (let i = 0; i < amountParams.amounts.length; i++) {
      recipients.push(b.address);
      totalAmount = totalAmount.add(amountParams.amounts[i]);
      starts.push(timeParams.starts[i] + now);
      cliffs.push(timeParams.cliffs[i] + now);
      unlocks.push(timeParams.unlocks[i] + now);
      let end = amountParams.amounts[i] / amountParams.rates[i] + starts[i];
      end += amountParams.amounts[i] % amountParams.rates[i] ? 0 : 1;
      ends.push(end);
    }
    if (vesting) {
      if (locked) {
        const tx = await batcher[
          'createLockedBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256[],bool,uint256)'
        ](
          streaming.address,
          recipients,
          token.address,
          amountParams.amounts,
          starts,
          cliffs,
          amountParams.rates,
          creator.address,
          unlocks,
          transferLocker,
          mintType
        );
        expect(tx).to.emit('BatchCreated').withArgs(mintType);
        for (let i = 0; i < amountParams.amounts.length; i++) {
          expect(tx)
            .to.emit('NFTCreated')
            .withArgs(
              i + 1,
              recipients[i],
              token.address,
              amountParams.amounts[i],
              starts[i],
              cliffs[i],
              ends[i],
              amountParams.rates[i],
              creator.address,
              unlocks[i],
              transferLocker
            );
        }
      } else {
        const tx = await batcher[
          'createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256)'
        ](
          streaming.address,
          recipients,
          token.address,
          amountParams.amounts,
          starts,
          cliffs,
          amountParams.rates,
          creator.address,
          mintType
        );
        expect(tx).to.emit('BatchCreated').withArgs(mintType);
        for (let i = 0; i < amountParams.amounts.length; i++) {
          expect(tx)
            .to.emit('NFTCreated')
            .withArgs(
              i + 1,
              recipients[i],
              token.address,
              amountParams.amounts[i],
              starts[i],
              cliffs[i],
              ends[i],
              amountParams.rates[i],
              creator.address,
              unlocks[i]
            );
        }
      }
    } else {
      const tx = await batcher[
        'createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],uint256)'
      ](
        streaming.address,
        recipients,
        token.address,
        amountParams.amounts,
        starts,
        cliffs,
        amountParams.rates,
        mintType
      );
      expect(tx).to.emit('BatchCreated').withArgs(mintType);
      for (let i = 0; i < amountParams.amounts.length; i++) {
        expect(tx)
          .to.emit('NFTCreated')
          .withArgs(
            i + 1,
            recipients[i],
            token.address,
            amountParams.amounts[i],
            starts[i],
            cliffs[i],
            ends[i],
            amountParams.rates[i]
          );
      }
    }
    expect(await token.balanceOf(streaming.address)).to.eq(totalAmount.add(priorStreamBalance));
    expect(await streaming.balanceOf(b.address)).to.eq(amountParams.amounts.length);
    expect(await streaming.lockedBalances(b.address, token.address)).to.eq(totalAmount);
  });
};
const batchErrorTests = (vesting, locked, bound) => {
  let s, streaming, creator, a, b, token, batcher;
  it('Fails if the recipients, amounts, starts, cliffs, and rates and unlocks array are not the same length', async () => {
    if (vesting == true) {
      s = await setupVesting();
    } else if (bound == true) {
      s = await setupBoundStreaming();
    } else {
      s = await setupStreaming();
    }
    streaming = s.streaming;
    batcher = s.batchStreamer;
    creator = s.creator;
    a = s.a;
    b = s.b;
    token = s.token;
    let now = await time.latest();
    let recipients = [a.address, b.address];
    let amounts = [C.E18_1];
    let starts = [now];
    let cliffs = [now];
    let rates = [C.E18_1];
    let unlocks = [now];
    let transferLock = true;
    if (vesting) {
      if (locked) {
        for (let i = 0; i < 5; i++) {
          if (i == 1) amounts.push(C.E18_1);
          if (i == 2) starts.push(now);
          if (i == 3) cliffs.push(0);
          if (i == 4) rates.push(C.E18_05);
          await expect(
            batcher[
              'createLockedBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256[],bool)'
            ](
              streaming.address,
              recipients,
              token.address,
              amounts,
              starts,
              cliffs,
              rates,
              creator.address,
              unlocks,
              transferLock
            )
          ).to.be.revertedWith('array length error');
        }
      } else {
        for (let i = 0; i < 4; i++) {
          if (i == 1) amounts.push(C.E18_1);
          if (i == 2) starts.push(now);
          if (i == 3) cliffs.push(0);
          await expect(
            batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address)'](
              streaming.address,
              recipients,
              token.address,
              amounts,
              starts,
              cliffs,
              rates,
              creator.address
            )
          ).to.be.revertedWith('array length error');
        }
      }
    } else {
      for (let i = 0; i < 4; i++) {
        if (i == 1) amounts.push(C.E18_1);
        if (i == 2) starts.push(now);
        if (i == 3) cliffs.push(0);
        await expect(
          batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[])'](
            streaming.address,
            recipients,
            token.address,
            amounts,
            starts,
            cliffs,
            rates
          )
        ).to.be.revertedWith('array length error');
      }
    }
  });
  it('Fails if any of the amounts are 0', async () => {
    let now = await time.latest();
    let amounts = [C.E18_1, C.ZERO];
    let recipients = [a.address, a.address];
    let starts = [now, now];
    let cliffs = [now, now];
    let rates = [C.E18_1, C.E18_1];
    let unlocks = [0, 0];
    let transferlock = true;
    if (vesting) {
      if (locked) {
        await expect(
          batcher[
            'createLockedBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256[],bool)'
          ](
            streaming.address,
            recipients,
            token.address,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address,
            unlocks,
            transferlock
          )
        ).to.be.revertedWith('SV04');
      } else {
        await expect(
          batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address)'](
            streaming.address,
            recipients,
            token.address,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address
          )
        ).to.be.revertedWith('SV04');
      }
    } else {
      await expect(
        batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[])'](
          streaming.address,
          recipients,
          token.address,
          amounts,
          starts,
          cliffs,
          rates
        )
      ).to.be.revertedWith('SV04');
    }
  });
  it('Fails if any of the recipients are 0', async () => {
    let now = await time.latest();
    let amounts = [C.E18_1, C.E18_1];
    let recipients = [a.address, C.ZERO_ADDRESS];
    let starts = [now, now];
    let cliffs = [now, now];
    let rates = [C.E18_1, C.E18_1];
    let unlocks = [0, 0];
    let transferlock = true;
    if (vesting) {
      if (locked) {
        await expect(
          batcher[
            'createLockedBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256[],bool)'
          ](
            streaming.address,
            recipients,
            token.address,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address,
            unlocks,
            transferlock
          )
        ).to.be.revertedWith('SV02');
      } else {
        await expect(
          batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address)'](
            streaming.address,
            recipients,
            token.address,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address
          )
        ).to.be.revertedWith('SV02');
      }
    } else {
      await expect(
        batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[])'](
          streaming.address,
          recipients,
          token.address,
          amounts,
          starts,
          cliffs,
          rates
        )
      ).to.be.revertedWith('SV02');
    }
  });
  it('Fails if the token address is 0', async () => {
    let now = await time.latest();
    let amounts = [C.E18_1, C.E18_1];
    let recipients = [a.address, a.adress];
    let starts = [now, now];
    let cliffs = [now, now];
    let rates = [C.E18_1, C.E18_1];
    let unlocks = [0, 0];
    if (vesting) {
      if (locked) {
        await expect(
          batcher[
            'createLockedBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256[],bool)'
          ](
            streaming.address,
            recipients,
            C.ZERO_ADDRESS,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address,
            unlocks,
            true
          )
        ).to.be.reverted;
      } else {
        await expect(
          batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address)'](
            streaming.address,
            recipients,
            C.ZERO_ADDRESS,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address
          )
        ).to.be.reverted;
      }
    } else {
      await expect(
        batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[])'](
          streaming.address,
          recipients,
          C.ZERO_ADDRESS,
          amounts,
          starts,
          cliffs,
          rates
        )
      ).to.be.reverted;
    }
  });
  it('Fails if a rate is larger than the amount or is 0', async () => {
    let now = await time.latest();
    let amounts = [C.E18_1, C.E18_1];
    let recipients = [a.address, a.address];
    let starts = [now, now];
    let cliffs = [now, now];
    let rates = [C.E18_1, C.E18_10];
    let unlocks = [0, 0];
    if (vesting) {
      if (locked) {
        await expect(
          batcher[
            'createLockedBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address,uint256[],bool)'
          ](
            streaming.address,
            recipients,
            token.address,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address,
            unlocks,
            true
          )
        ).to.be.revertedWith('SV05');
      } else {
        await expect(
          batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[],address)'](
            streaming.address,
            recipients,
            token.address,
            amounts,
            starts,
            cliffs,
            rates,
            creator.address
          )
        ).to.be.revertedWith('SV05');
      }
    } else {
      await expect(
        batcher['createBatch(address,address[],address,uint256[],uint256[],uint256[],uint256[])'](
          streaming.address,
          recipients,
          token.address,
          amounts,
          starts,
          cliffs,
          rates
        )
      ).to.be.revertedWith('SV05');
    }
  });
};

module.exports = {
  batchTests,
  batchErrorTests,
};
