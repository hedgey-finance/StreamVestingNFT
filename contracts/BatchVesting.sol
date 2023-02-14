// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import './interfaces/IVestingNFT.sol';
import './libraries/TransferHelper.sol';

contract BatchVester {
  event BatchCreated(uint256 mintType);

  function createBatch(
    address vester,
    address[] memory recipients,
    address token,
    uint256[] memory amounts,
    uint256[] memory starts,
    uint256[] memory cliffs,
    uint256[] memory rates,
    address manager,
    uint256[] memory unlocks
  ) external {
    uint256 totalAmount;
    for (uint256 i; i < amounts.length; i++) {
      require(amounts[i] > 0, 'SV04');
      totalAmount += amounts[i];
    }
    _createBatch(vester, recipients, token, amounts, totalAmount, starts, cliffs, rates, manager, unlocks);
  }

  function createBatch(
    address vester,
    address[] memory recipients,
    address token,
    uint256[] memory amounts,
    uint256[] memory starts,
    uint256[] memory cliffs,
    uint256[] memory rates,
    address manager,
    uint256[] memory unlocks,
    uint256 mintType
  ) external {
    uint256 totalAmount;
    for (uint256 i; i < amounts.length; i++) {
      require(amounts[i] > 0, 'SV04');
      totalAmount += amounts[i];
    }
    emit BatchCreated(mintType);
    _createBatch(vester, recipients, token, amounts, totalAmount, starts, cliffs, rates, manager, unlocks);
  }

  function _createBatch(
    address vester,
    address[] memory recipients,
    address token,
    uint256[] memory amounts,
    uint256 totalAmount,
    uint256[] memory starts,
    uint256[] memory cliffs,
    uint256[] memory rates,
    address manager,
    uint256[] memory unlocks
  ) internal {
    require(
      recipients.length == amounts.length &&
        amounts.length == starts.length &&
        starts.length == cliffs.length &&
        cliffs.length == rates.length &&
        unlocks.length == cliffs.length,
        'array length error'
    );
    TransferHelper.transferTokens(token, msg.sender, address(this), totalAmount);
    SafeERC20.safeIncreaseAllowance(IERC20(token), vester, totalAmount);
    for (uint256 i; i < recipients.length; i++) {
      IVestingNFT(vester).createNFT(
        recipients[i],
        token,
        amounts[i],
        starts[i],
        cliffs[i],
        rates[i],
        manager,
        unlocks[i]
      );
    }
  }
}
