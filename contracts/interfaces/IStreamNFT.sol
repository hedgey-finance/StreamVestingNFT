// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

interface IStreamNFT {
  event NFTCreated(
    uint256 id,
    address holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 end,
    uint256 rate,
    bool revocable,
    address funder
  );
  event NFTRevoked(uint256 id, uint256 remainder, uint256 balance);
  event NFTRedeemed(uint256 id, uint256 balance);
  event NFTPartiallyRedeemed(uint256 id, uint256 remainder, uint256 balance);
  event URISet(string newURI);

  function createNFT(
    address holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 rate,
    bool revocable,
    address funder
  ) external;

  function revokeNFT(uint256 tokenId) external;

  function redeemNFT(uint256 tokenId) external;

  function streamBalanceOf(uint256 tokenId) external view returns (uint256 balance, uint256 remainder);

  function getStreamEnd(uint256 tokenId) external view returns (uint256 end);
}
