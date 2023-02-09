// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

interface IVestingNFT {
  event NFTCreated(
    uint256 indexed id,
    address holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 end,
    uint256 rate,
    address manager,
    uint256 unlockDate
  );
  event NFTRevoked(uint256 indexed id, uint256 balance, uint256 remainder);
  event NFTRedeemed(uint256 indexed id, uint256 balance, uint256 remainder);
  event URISet(string newURI);

  function createNFT(
    address holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 rate,
    address manager,
    uint256 unlockDate
  ) external;

  function revokeNFT(uint256[] memory tokenId) external;

  function redeemNFT(uint256[] memory tokenId) external;
  function redeemAllNFTs() external;

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
      uint256 rate,
      address manager,
      uint256 unlockDate
    );

    function balanceOf(address holder) external view returns (uint256 balance);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
    function balanceOfDelegate(address delegate) external view returns (uint256);
    function delegatedTo(uint256 tokenId) external view returns (address);
    function tokenOfDelegateByIndex(address delegate, uint256 index) external view returns (uint256);
}