// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

interface IStreamNFT {
  event NFTCreated(
    uint256 indexed id,
    address indexed recipient,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 end,
    uint256 rate
  );
  event NFTRedeemed(uint256 id, uint256 balance, uint256 remainder);
  event URISet(string newURI);

  function updateBaseURI(string memory _uri) external;

  function deleteAdmin() external;

  function createNFT(
    address recipient,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 rate
  ) external;

  function redeemAndTransfer(uint256 tokenId, address to) external;

  function redeemNFT(uint256[] memory tokenIds) external;

  function redeemAllNFTs() external;

  function delegateToken(address delegate, uint256[] memory tokenIds) external;

  function delegateAllNFTs(address delegate) external;

  function streamBalanceOf(uint256 tokenId) external view returns (uint256 balance, uint256 remainder);

  function getStreamEnd(uint256 tokenId) external view returns (uint256 end);

  function streams(uint256 tokenId)
    external
    view
    returns (
      address token,
      uint256 amount,
      uint256 start,
      uint256 cliffDate,
      uint256 rate
    );

  function balanceOf(address holder) external view returns (uint256 balance);

  function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);

  function tokenByIndex(uint256 index) external view returns (uint256);

  function balanceOfDelegate(address delegate) external view returns (uint256);

  function delegatedTo(uint256 tokenId) external view returns (address);

  function tokenOfDelegateByIndex(address delegate, uint256 index) external view returns (uint256);

  function lockedBalances(address holder, address token) external view returns (uint256);

  function delegatedBalances(address delegate, address token) external view returns (uint256);
}
