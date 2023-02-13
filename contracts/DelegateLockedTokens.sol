// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

interface GovToken {
  function delegate(address delegatee) external;
}

/// @notice this is a small contract that will allow owners of locked token NFTs to vote on-chain with their balances
/// this works when someone wants to vote they must initialize a new voting contract
/// which pulls their locked balances into the contract
/// the tokens are managed by the NFT contract and can pull them back at any time

contract DelegateLockedTokens {
  using SafeERC20 for IERC20;

  address public hedgey;
  uint256 public tokenId;
  address public token;

  event TokensDelegated(address delegatee);

  constructor(address _token, uint256 _tokenId) {
    hedgey = msg.sender;
    tokenId = _tokenId;
    token = _token;
  }

  function delegate(address delegatee) external {
    require(msg.sender == hedgey);
    GovToken(token).delegate(delegatee);
    emit TokensDelegated(delegatee);
  }

  function removeTokens(uint256 amount) external {
    require(msg.sender == hedgey);
    require(IERC20(token).balanceOf(address(this)) >= amount);
    SafeERC20.safeTransfer(IERC20(token), hedgey, amount);
  }
}
