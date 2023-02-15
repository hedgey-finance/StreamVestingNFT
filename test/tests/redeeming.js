const { expect } = require('chai');
const { setupStreaming, setupBoundStreaming, setupVesting } = require('../fixtures');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const C = require('../constants');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

const calculatedBalance = (start, cliff, amount, rate, time) => {
  let remainder = C.ZERO;
  let balance = C.ZERO;
  if (start >= time || cliff >= time) {
    remainder = amount;
    balance = 0;
  } else {
    let streamed = BigNumber.from(time).sub(start).mul(rate);
    balance = C.bigMin(streamed, amount);
    remainder = amount.sub(balance);
  }
  return {
    balance,
    remainder,
  };
};

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
