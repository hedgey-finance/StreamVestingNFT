// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './libraries/TransferHelper.sol';



/**
 * @title An NFT representation of ownership of time locked tokens
 * @notice The time locked tokens are redeemable by the owner of the NFT
 * @notice The NFT is basic ERC721 with an ownable usage to ensure only a single owner call mint new NFTs
 * @notice it uses the Enumerable extension to allow for easy lookup to pull balances of one account for multiple NFTs
 */

contract StreamVestingNFT is ERC721Enumerable, ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  /// @dev baseURI is the URI directory where the metadata is stored
  string private baseURI;
  /// @dev admin for setting the baseURI;
  address private admin;

  /// @dev the Stream is the storage in a struct of the tokens that are currently being streamed
  /// @dev token is the token address being streamed
  /// @dev amount is the total amount of tokens in the stream
  /// @dev start is the start date when token stream begins
  /// @dev rate is the number of tokens per second being streamed
  /// @dev revocable is a bool check, if true then the streamer can cancel the stream anytime before the start date. after start date it cannot be revoked
  /// @dev funder is the person who funds the stream payments
  struct Stream {
    address token;
    uint256 amount;
    uint256 start;
    uint256 cliffDate;
    uint256 rate;
    bool revocable;
    address manager;
  }

  mapping(uint256 => Stream) public streams;

  /// @dev maps from user wallet to token to total locked balance of that token - helpful for voting
  mapping(address => mapping(address => uint256)) public lockedBalance;

  ///@notice Events when a new NFT (future) is created and one with a Future is redeemed (burned)
  event NFTCreated(
    uint256 id,
    address holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 end,
    uint256 rate,
    bool revocable,
    address manager
  );
  event NFTRevoked(uint256 indexed id, uint256 remainder, uint256 balance);
  event NFTRedeemed(uint256 indexed id, uint256 balance);
  event NFTPartiallyRedeemed(uint256 indexed id, uint256 remainder, uint256 balance);
  event URISet(string newURI);

  constructor(string memory name, string memory symbol) ERC721(name, symbol) {
    admin = msg.sender;
  }

  /// @dev internal function used by the standard ER721 function tokenURI to retrieve the baseURI privately held to visualize and get the metadata
  function _baseURI() internal view override returns (string memory) {
    return baseURI;
  }

  /// @notice function to set the base URI after the contract has been launched, only once - this is done by the admin
  /// @notice there is no actual on-chain functions that require this URI to be anything beyond a blank string ("")
  /// @param _uri is the new baseURI for the metadata
  function updateBaseURI(string memory _uri) external {
    /// @dev this function can only be called by the admin
    require(msg.sender == admin, 'NFT02');
    /// @dev update the baseURI with the new _uri
    baseURI = _uri;
    /// @dev delete the admin
    delete admin;
    /// @dev emit event of the update uri
    emit URISet(_uri);
  }

  function createNFT(
    address holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 rate,
    bool revocable,
    address manager
  ) external nonReentrant {
    require(holder != address(0) && manager != address(0));
    require(token != address(0));
    require(amount > 0);
    require(rate > 0 && rate <= amount);
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();
    uint256 end = endDate(start, rate, amount);
    lockedBalance[holder][token] += amount;
    TransferHelper.transferTokens(token, msg.sender, address(this), amount);
    streams[newItemId] = Stream(token, amount, start, cliffDate, rate, revocable, manager);
    _safeMint(holder, newItemId);
    emit NFTCreated(newItemId, holder, token, amount, start, cliffDate, end, rate, revocable, manager);
  }

  function revokeNFT(uint256 tokenId, address fundsRecipient) external nonReentrant {
    Stream memory stream = streams[tokenId];
    require(stream.manager == msg.sender, 'not manager');
    require(stream.revocable, 'not revocable');
    (uint256 balance, uint256 remainder) = streamBalanceOf(tokenId);
    address holder = ownerOf(tokenId);
    lockedBalance[holder][stream.token] -= stream.amount;
    delete streams[tokenId];
    _burn(tokenId);
    TransferHelper.withdrawTokens(stream.token, fundsRecipient, remainder);
    TransferHelper.withdrawTokens(stream.token, holder, balance);
    emit NFTRevoked(tokenId, remainder, balance);
  }

  /// @notice this is the external function that actually redeems an NFT position
  /// @notice returns true if the function is successful
  /// @dev this function calls the _redeemFuture(...) internal function which handles the requirements and checks
  function redeemNFT(uint256 tokenId) external nonReentrant returns (bool) {
    /// @dev calls the internal _redeemNFT function that performs various checks to ensure that only the owner of the NFT can redeem their NFT and Future position
    _redeemNFT(msg.sender, tokenId);
    return true;
  }

  function bulkRedeem(uint256[] memory tokenIds) external nonReentrant {
    for (uint256 i; i < tokenIds.length; i++) {
      _redeemNFT(msg.sender, tokenIds[i]);
    }
  }

  /// @notice function to partially redeem the tokens inside the NFT
  /// this is really only used if you want to redeem all but the last token in the NFT to preserve the NFT itself
  function partialRedeem(uint256 tokenId, uint256 redemptionAmount) external nonReentrant {
    require(ownerOf(tokenId) == msg.sender, 'NFT03');
    Stream memory stream = streams[tokenId];
    (uint256 balance, uint256 remainder) = streamBalanceOf(tokenId);
    require(balance > 0, 'nothing to redeem');
    require(redemptionAmount < balance, 'not partial');
    streams[tokenId].amount -= redemptionAmount;
    lockedBalance[msg.sender][stream.token] -= redemptionAmount;
    // sets the start date to now so that the remaining balance starts streaming again starting now
    streams[tokenId].start = block.timestamp;
    emit NFTPartiallyRedeemed(tokenId, remainder, redemptionAmount);
    TransferHelper.withdrawTokens(stream.token, msg.sender, redemptionAmount);
  }

  function _redeemNFT(address holder, uint256 tokenId) internal returns (uint256 balance, uint256 remainder) {
    /// @dev ensure that only the owner of the NFT can call this function
    require(ownerOf(tokenId) == holder, 'NFT03');
    Stream memory stream = streams[tokenId];
    (balance, remainder) = streamBalanceOf(tokenId);
    require(balance > 0, 'nothing to redeem');
    lockedBalance[holder][stream.token] -= balance;
    if (balance == stream.amount) {
      delete streams[tokenId];
      _burn(tokenId);
      emit NFTRedeemed(tokenId, balance);
    } else {
      // resets the amount
      streams[tokenId].amount -= balance;
      // sets the start date to now so that the remaining balance starts streaming again starting now
      streams[tokenId].start = block.timestamp;
      emit NFTPartiallyRedeemed(tokenId, remainder, balance);
    }
    // deliver the requested token balance to the holder
    TransferHelper.withdrawTokens(stream.token, holder, balance);
  }

  function streamBalanceOf(uint256 tokenId) public view returns (uint256 balance, uint256 remainder) {
    Stream memory stream = streams[tokenId];
    if (stream.start >= block.timestamp || stream.cliffDate >= block.timestamp) {
      remainder = stream.amount;
    } else {
      /// @dev balance is just the number of seconds passed times the rate of tokens streamed per second, up to the total amount, ie min of the two
      balance = min((block.timestamp - stream.start) * stream.rate, stream.amount);
      remainder = stream.amount - balance;
    }
  }

  function getStreamEnd(uint256 tokenId) public view returns (uint256 end) {
    Stream memory stream = streams[tokenId];
    end = endDate(stream.start, stream.rate, stream.amount);
  }

  function endDate(
    uint256 start,
    uint256 rate,
    uint256 amount
  ) public pure returns (uint256 end) {
    end = (amount / rate) + start;
  }

  function min(uint256 a, uint256 b) public pure returns (uint256 _min) {
    _min = (a <= b) ? a : b;
  }
}
