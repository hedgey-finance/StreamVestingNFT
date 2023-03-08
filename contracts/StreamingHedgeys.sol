// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './StreamingNFT.sol';

contract StreamingHedgeys is StreamingNFT {
  constructor(string memory name, string memory symbol) StreamingNFT(name, symbol) {
    admin = msg.sender;
  }

  /// @dev function to transfer and redeem tokens
  /// @dev this is helpful because tokens are continuously unlocking, this function will unlock the max amount of tokens prior to a transfer to ensure no leftover
  /// @dev the token must have a remainder or else it cannot be transferred
  /// @param tokenId is the id of the the NFT token
  /// @param to is the address the NFT is being transferred to
  function redeemAndTransfer(uint256 tokenId, address to) external nonReentrant {
    uint256 remainder = _redeemNFT(msg.sender, tokenId);
    require(remainder > 0, 'SV11');
    _transfer(msg.sender, to, tokenId);
  }
}
