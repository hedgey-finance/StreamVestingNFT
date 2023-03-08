// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './StreamingNFT.sol';

/**
 * @title An NFT representation of ownership of time locked tokens that unlock continuously per second
 * @notice The time locked tokens are redeemable by the owner of the NFT
 * @notice this bound NFT collection cannot be transferred
 * @notice it uses the Enumerable extension to allow for easy lookup to pull balances of one account for multiple NFTs
 * it also uses a new ERC721 Delegate contract that allows users to delegate their NFTs to other wallets for the puprose of voting
 * @author alex michelsen aka icemanparachute
 */

contract StreamingBoundHedgeys is StreamingNFT {
  constructor(string memory name, string memory symbol) StreamingNFT(name, symbol) {
    admin = msg.sender;
  }

  /// @dev these NFTs cannot be transferred
  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    revert('Not transferrable');
  }
}
