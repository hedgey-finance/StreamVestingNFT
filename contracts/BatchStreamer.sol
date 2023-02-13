// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './interfaces/IStreamNFT.sol';
import './libraries/TransferHelper.sol';

contract BatchStreamer {
  event BatchCreated(uint256 mintType);

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
      totalAmount += amounts[i];
    }
    _createBatch(streamer, recipients, token, amounts, totalAmount, starts, cliffs, rates);
  }

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
      totalAmount += amounts[i];
    }
    emit BatchCreated(mintType);
    _createBatch(streamer, recipients, token, amounts, totalAmount, starts, cliffs, rates);
  }

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
        cliffs.length == rates.length
    );
    TransferHelper.transferTokens(token, msg.sender, address(this), totalAmount);
    for (uint256 i; i < recipients.length; i++) {
      IStreamNFT(streamer).createNFT(recipients[i], token, amounts[i], starts[i], cliffs[i], rates[i]);
    }
  }
}
