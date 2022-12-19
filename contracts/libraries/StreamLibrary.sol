// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

library StreamLibrary {
  function min(uint256 a, uint256 b) external pure returns (uint256 _min) {
    _min = (a <= b) ? a : b;
  }

  function endDate(
    uint256 start,
    uint256 rate,
    uint256 amount
  ) external pure returns (uint256 end) {
    end = (amount / rate) + start;
  }
}
