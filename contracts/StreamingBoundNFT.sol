// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import './ERC721Delegate/ERC721Delegate.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './libraries/TransferHelper.sol';
import './libraries/StreamLibrary.sol';

/**
 * @title An NFT representation of ownership of time locked tokens
 * @notice The time locked tokens are redeemable by the owner of the NFT
 * @notice The NFT is basic ERC721 with an ownable usage to ensure only a single owner call mint new NFTs
 * @notice it uses the Enumerable extension to allow for easy lookup to pull balances of one account for multiple NFTs
 */

contract StreamingBoundHedgeys is ERC721Delegate, ReentrancyGuard {
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
  }

  mapping(uint256 => Stream) public streams;

  ///@notice Events when a new NFT (future) is created and one with a Future is redeemed (burned)
  event NFTCreated(
    uint256 indexed id,
    address indexed holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 end,
    uint256 rate
  );
  event NFTRedeemed(uint256 indexed id, uint256 balance, uint256 remainder);
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
    require(msg.sender == admin, 'NFT02');
    baseURI = _uri;
    emit URISet(_uri);
  }

  function deleteAdmin() external {
    require(msg.sender == admin);
    delete admin;
  }

  function createNFT(
    address holder,
    address token,
    uint256 amount,
    uint256 start,
    uint256 cliffDate,
    uint256 rate
  ) external nonReentrant {
    require(holder != address(0));
    require(token != address(0));
    require(amount > 0);
    require(rate > 0 && rate <= amount);
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();
    uint256 end = StreamLibrary.endDate(start, rate, amount);
    TransferHelper.transferTokens(token, msg.sender, address(this), amount);
    streams[newItemId] = Stream(token, amount, start, cliffDate, rate);
    _safeMint(holder, newItemId);
    emit NFTCreated(newItemId, holder, token, amount, start, cliffDate, end, rate);
  }

  function delegateAll(address delegate) external {
    for (uint256 i; i < balanceOf(msg.sender); i++) {
      uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
      delegateToken(delegate, tokenId);
    }
  }

  /// @notice function to partially redeem and then transfer the NFT
  /// this is useful to claim up to the second tokens before transferring them
  /// @dev will revert if it is a full redemption as the NFT will be deleted
  function redeemAndTransfer(uint256 tokenId, address to) external nonReentrant {
    uint256 remainder = _redeemNFT(msg.sender, tokenId);
    require(remainder > 0, 'NFT fully redeemed');
    _transfer(msg.sender, to, tokenId);
  }

  function redeemNFT(uint256[] memory tokenIds) external nonReentrant {
    for (uint256 i; i < tokenIds.length; i++) {
      _redeemNFT(msg.sender, tokenIds[i]);
    }
  }

  /// @notice function to claim for all of my owned NFTs
  /// @dev pulls the balance and uses the enumerate function to redeem each NFT based on their index id
  function redeemAllNFTs() external nonReentrant {
    for (uint256 i; i < balanceOf(msg.sender); i++) {
      //check the balance of the vest first
      uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
      (uint256 balance, ) = streamBalanceOf(tokenId);
      if (balance > 0) {
        _redeemNFT(msg.sender, tokenId);
      }
    }
  }

  function _redeemNFT(address holder, uint256 tokenId) internal returns (uint256 remainder) {
    require(ownerOf(tokenId) == holder, 'NFT03');
    Stream memory stream = streams[tokenId];
    uint256 balance;
    (balance, remainder) = StreamLibrary.streamBalanceAtTime(
      stream.start,
      stream.cliffDate,
      stream.amount,
      stream.rate,
      block.timestamp
    );
    require(balance > 0, 'nothing to redeem');
    if (balance == stream.amount) {
      delete streams[tokenId];
      _burn(tokenId);
    } else {
      streams[tokenId].amount -= balance;
      streams[tokenId].start = block.timestamp;
    }
    TransferHelper.withdrawTokens(stream.token, holder, balance);
    emit NFTRedeemed(tokenId, balance, remainder);
  }

  function streamBalanceOf(uint256 tokenId) public view returns (uint256 balance, uint256 remainder) {
    Stream memory stream = streams[tokenId];
    (balance, remainder) = StreamLibrary.streamBalanceAtTime(
      stream.start,
      stream.cliffDate,
      stream.amount,
      stream.rate,
      block.timestamp
    );
  }

  function getStreamEnd(uint256 tokenId) public view returns (uint256 end) {
    Stream memory stream = streams[tokenId];
    end = StreamLibrary.endDate(stream.start, stream.rate, stream.amount);
  }

  function lockedBalances(address holder, address token) public view returns (uint256 lockedBalance) {
    uint256 holdersBalance = balanceOf(holder);
    for (uint256 i; i < holdersBalance; i++) {
      uint256 tokenId = tokenOfOwnerByIndex(holder, i);
      Stream memory stream = streams[tokenId];
      if (token == stream.token) {
        lockedBalance += stream.amount;
      }
    }
  }

  function delegatedBalances(address delegate, address token) public view returns (uint256 delegatedBalance) {
    uint256 delegateBalance = balanceOfDelegate(delegate);
    for (uint256 i; i < delegateBalance; i++) {
      uint256 tokenId = tokenOfDelegateByIndex(delegate, i);
      Stream memory stream = streams[tokenId];
      if (token == stream.token) {
        delegatedBalance += stream.amount;
      }
    }
  }

  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    revert('Not transferrable');
  }
}
