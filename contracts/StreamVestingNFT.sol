// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './libraries/TransferHelper.sol';
import './libraries/StreamLibrary.sol';
import './libraries/NFTHelper.sol';

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

  address public nftLocker;

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
    address manager;
    uint256 unlockDate;
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
    address manager,
    uint256 unlockDate
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
    address manager,
    uint256 unlockDate
  ) external nonReentrant {
    require(holder != address(0));
    require(token != address(0));
    require(amount > 0);
    require(rate > 0 && rate <= amount);
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();
    uint256 end = StreamLibrary.endDate(start, rate, amount);
    lockedBalance[holder][token] += amount;
    TransferHelper.transferTokens(token, msg.sender, address(this), amount);
    streams[newItemId] = Stream(token, amount, start, cliffDate, rate, manager, unlockDate);
    _safeMint(holder, newItemId);
    emit NFTCreated(newItemId, holder, token, amount, start, cliffDate, end, rate, manager, unlockDate);
  }

  function redeemNFT(uint256[] memory tokenIds) external nonReentrant {
    for (uint256 i; i < tokenIds.length; i++) {
      _redeemNFT(msg.sender, tokenIds[i]);
    }
  }

  function revokeNFT(uint256[] memory tokenIds, address fundsRecipient) external nonReentrant {
    for (uint256 i; i < tokenIds.length; i++) {
      _revokeNFT(msg.sender, tokenIds[i], fundsRecipient);
    }
  }

  function _redeemNFT(address holder, uint256 tokenId) internal returns (uint256 balance, uint256 remainder) {
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
      streams[tokenId].amount -= balance;
      streams[tokenId].start = block.timestamp;
      emit NFTPartiallyRedeemed(tokenId, remainder, balance);
    }
    if (stream.unlockDate > block.timestamp) {
      NFTHelper.lockTokens(nftLocker, holder, stream.token, balance, stream.unlockDate);
    } else {
      TransferHelper.withdrawTokens(stream.token, holder, balance);
    }
  }

  function _revokeNFT(
    address manager,
    uint256 tokenId,
    address fundsRecipient
  ) internal {
    Stream memory stream = streams[tokenId];
    require(stream.manager == manager, 'not manager');
    (uint256 balance, uint256 remainder) = streamBalanceOf(tokenId);
    address holder = ownerOf(tokenId);
    lockedBalance[holder][stream.token] -= stream.amount;
    delete streams[tokenId];
    _burn(tokenId);
    TransferHelper.withdrawTokens(stream.token, fundsRecipient, remainder);
    if (stream.unlockDate > block.timestamp) {
      NFTHelper.lockTokens(nftLocker, holder, stream.token, balance, stream.unlockDate);
    } else {
      TransferHelper.withdrawTokens(stream.token, holder, balance);
    }
    emit NFTRevoked(tokenId, remainder, balance);
  }

  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    revert('Not transferrable');
  }

  function streamBalanceOf(uint256 tokenId) public view returns (uint256 balance, uint256 remainder) {
    Stream memory stream = streams[tokenId];
    if (stream.start >= block.timestamp || stream.cliffDate >= block.timestamp) {
      remainder = stream.amount;
    } else {
      /// @dev balance is just the number of seconds passed times the rate of tokens streamed per second, up to the total amount, ie min of the two
      balance = StreamLibrary.min((block.timestamp - stream.start) * stream.rate, stream.amount);
      remainder = stream.amount - balance;
    }
  }

  function streamBalanceAtTime(uint256 tokenId, uint256 time) public view returns (uint256 balance, uint256 remainder) {
    Stream memory stream = streams[tokenId];
    if (stream.start >= time || stream.cliffDate >= time) {
      remainder = stream.amount;
    } else {
      /// @dev balance is just the number of seconds passed times the rate of tokens streamed per second, up to the total amount, ie min of the two
      balance = StreamLibrary.min((time - stream.start) * stream.rate, stream.amount);
      remainder = stream.amount - balance;
    }
  }

  function getStreamEnd(uint256 tokenId) public view returns (uint256 end) {
    Stream memory stream = streams[tokenId];
    end = StreamLibrary.endDate(stream.start, stream.rate, stream.amount);
  }
}
