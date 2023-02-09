// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.17;

import '../interfaces/IVestingNFT.sol';

library VestingLibrary {
  function min(uint256 a, uint256 b) public pure returns (uint256 _min) {
    _min = (a <= b) ? a : b;
  }

  function endDate(
    uint256 start,
    uint256 rate,
    uint256 amount
  ) public pure returns (uint256 end) {
    end = (amount / rate) + start;
  }

  function streamBalanceAtTime(
    uint256 start,
    uint256 cliff,
    uint256 amount,
    uint256 rate,
    uint256 time
  ) public pure returns (uint256 balance, uint256 remainder) {
    if (start >= time || cliff >= time) {
      remainder = amount;
    } else {
      balance = min((time - start) * rate, amount);
      remainder = amount - balance;
    }
  }

  function getLockedBalances(address holder, address token) public view returns (uint256 lockedBalance) {
    uint256 holdersBalance = IVestingNFT(address(this)).balanceOf(holder);
    for (uint256 i; i < holdersBalance; i++) {
      uint256 tokenId = IVestingNFT(address(this)).tokenOfOwnerByIndex(holder, i);
      (address _token, uint256 amount, , , , , ) = IVestingNFT(address(this)).streams(tokenId);
      if (token == _token) {
        lockedBalance += amount;
      }
    }
  }

  function getDelegatedBalances(address delegate, address token) public view returns (uint256 lockedBalance) {
    uint256 delegateBalance = IVestingNFT(address(this)).balanceOfDelegate(delegate);
    for (uint256 i; i < delegateBalance; i++) {
      uint256 tokenId = IVestingNFT(address(this)).tokenOfDelegateByIndex(delegate, i);
      (address _token, uint256 amount, , , , , ) = IVestingNFT(address(this)).streams(tokenId);
      if (token == _token) {
        lockedBalance += amount;
      }
    }
  }
}
