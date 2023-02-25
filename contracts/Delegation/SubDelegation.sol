// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

/// @notice NFTDelegate is a basic contract to help sub-delegate balanes from delegated NFTs for snapshot voting

import '../ERC721Delegate/ERC721Delegate.sol';
import '../interfaces/IStreamNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

contract SubDelegation {
  // each NFT must be separately sub-delegated
  address public collection;

  // used for percent calculation
  uint256 public points = 100;

  /// mapps the tokenId to a subdelegate address which maps to the actual subdelegate percent
  mapping(uint256 => mapping(address => uint256)) subDelegations;

  /// maps a tokenId to the percent delegated to ensure its never more than 100
  mapping(uint256 => uint256) percentDelegated;

  constructor(address _collection) {
    collection = _collection;
  }

  function subDelegate(
    uint256 tokenId,
    address delegate,
    uint256 percent
  ) external {
    require(canDelegate(msg.sender, tokenId));
    uint256 currentPercent = percentDelegated[tokenId];
    require(currentPercent + percent <= points, 'percent overflow');
    percentDelegated[tokenId] += percent;
    subDelegations[tokenId][delegate] = percent;
  }

  function removeDelegate(uint256 tokenId, address delegate) external {
    require(canDelegate(msg.sender, tokenId));
    uint256 subDelegatedPercent = subDelegations[tokenId][delegate];
    percentDelegated[tokenId] -= subDelegatedPercent;
    subDelegations[tokenId][delegate] = 0;
  }

  function switchDelegates(
    uint256 tokenId,
    address formerDelegate,
    address newDelegate
  ) external {
    require(canDelegate(msg.sender, tokenId));
    uint256 subDelegatedPercent = subDelegations[tokenId][formerDelegate];
    subDelegations[tokenId][formerDelegate] = 0;
    subDelegations[tokenId][newDelegate] = subDelegatedPercent;
  }

  function canDelegate(address delegator, uint256 tokenId) public view returns (bool) {
    require(delegator == IERC721(collection).ownerOf(tokenId), 'only token owner');
    require(IStreamNFT(collection).delegatedTo(tokenId) == address(this), 'this address must be delegate');
    return true;
  }

  function getSubDelegateBalance(address delegate, address token) public view returns (uint256 votes) {
    // get the tokens that are delegated to this address
    uint256 delegatedBalance = IStreamNFT(collection).balanceOfDelegate(address(this));
    for (uint256 i; i < delegatedBalance; i++) {
      // get the tokenId for each
      uint256 tokenId = IStreamNFT(collection).tokenOfDelegateByIndex(address(this), i);
      (address _token, uint256 amount, , , ) = IStreamNFT(collection).streams(tokenId);
      uint256 percent = subDelegations[tokenId][delegate];
      // if both the token matches, and the percent is greater than 0, then we add the percent to the votes
      if (percent > 0 && token == _token) {
        uint256 nftVotes = (amount * percent) / points;
        require(nftVotes <= amount, 'votes cant exceed amount');
        votes += nftVotes;
      }
    }
  }
}
