// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './interfaces/IStreamNFT.sol';
import './libraries/TransferHelper.sol';

/// @title BatchStreamer is a simple contract to create multiple streaming NFTs in a single
/// this contract is used as a layer on top of the StreamingNFT core contract

contract BatchStreamer {
  event BatchCreated(uint256 mintType);

  /// @notice craeate a batch of streamingNFTs with the same token to various recipients, amounts, start dates, cliffs and rates
  /// @param streamer is the address of the StreamingNFT contrac this points to, either the StreamingHedgeys or the StreamingBoundHedgeys
  /// @param recipients is the array of addresses for those wallets receiving the streams
  /// @param token is the address of the token to be locked inside the NFTs and linearly unlocked to the recipients
  /// @param amounts is the array of the amount of tokens to be locked in each NFT, each directly related in sequence to the recipient and other arrays
  /// @param starts is the array of start dates that define when each NFT will begin linearly unlocking
  /// @param cliffs is the array of cliff dates that define each cliff date for the NFT stream
  /// @param rates is the array of per second rates that each NFT will unlock at the rate of

  function createBatch(
    address streamer,
    address[] memory recipients,
    address token,
    uint256[] memory amounts,
    uint256[] memory starts,
    uint256[] memory cliffs,
    uint256[] memory rates
  ) external {
    uint256 totalAmount;
    for (uint256 i; i < amounts.length; i++) {
      require(amounts[i] > 0, 'SV04');
      totalAmount += amounts[i];
    }
    _createBatch(streamer, recipients, token, amounts, totalAmount, starts, cliffs, rates);
  }

  /// @notice craeate a batch of streamingNFTs with the same token to various recipients, amounts, start dates, cliffs and rates
  /// this contract has a special event emitted based on the mintType param
  /// @param streamer is the address of the StreamingNFT contrac this points to, either the StreamingHedgeys or the StreamingBoundHedgeys
  /// @param recipients is the array of addresses for those wallets receiving the streams
  /// @param token is the address of the token to be locked inside the NFTs and linearly unlocked to the recipients
  /// @param amounts is the array of the amount of tokens to be locked in each NFT, each directly related in sequence to the recipient and other arrays
  /// @param starts is the array of start dates that define when each NFT will begin linearly unlocking
  /// @param cliffs is the array of cliff dates that define each cliff date for the NFT stream
  /// @param rates is the array of per second rates that each NFT will unlock at the rate of
  /// @param mintType is an internal identifier used by Hedgey Applications to record special identifiers for special metadata creation and internal analytics tagging

  function createBatch(
    address streamer,
    address[] memory recipients,
    address token,
    uint256[] memory amounts,
    uint256[] memory starts,
    uint256[] memory cliffs,
    uint256[] memory rates,
    uint256 mintType
  ) external {
    uint256 totalAmount;
    for (uint256 i; i < amounts.length; i++) {
      require(amounts[i] > 0, 'SV04');
      totalAmount += amounts[i];
    }
    emit BatchCreated(mintType);
    _createBatch(streamer, recipients, token, amounts, totalAmount, starts, cliffs, rates);
  }

  /// @notice _createBatch is the internal function called by the external createBatch functions
  /// it checks all of the arrays are the same length
  /// and takes one additional input, the total amount, which it then pulls into the contract to then mint each NFT to the recipient
  function _createBatch(
    address streamer,
    address[] memory recipients,
    address token,
    uint256[] memory amounts,
    uint256 totalAmount,
    uint256[] memory starts,
    uint256[] memory cliffs,
    uint256[] memory rates
  ) internal {
    require(
      recipients.length == amounts.length &&
        amounts.length == starts.length &&
        starts.length == cliffs.length &&
        cliffs.length == rates.length,
      'array length error'
    );
    TransferHelper.transferTokens(token, msg.sender, address(this), totalAmount);
    SafeERC20.safeIncreaseAllowance(IERC20(token), streamer, totalAmount);
    for (uint256 i; i < recipients.length; i++) {
      IStreamNFT(streamer).createNFT(recipients[i], token, amounts[i], starts[i], cliffs[i], rates[i]);
    }
  }
}
