// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/ERC721Enumerable.sol)

pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';

/**
 * @dev This implements an optional extension of {ERC721} defined in the EIP that adds
 * enumerability of all the token ids in the contract as well as all token ids owned by each
 * account.
 */

/// @notice this is an ERC721Enumerable Contract
/// but with the additional added functionality that you can delegate your NFT to someone else, for the sole puprose that that NFT has voting rights
abstract contract ERC721Delegate is ERC721 {
  // Mapping from owner to list of owned token IDs
  mapping(address => mapping(uint256 => uint256)) private _ownedTokens;

  // Mapping from token ID to index of the owner tokens list
  mapping(uint256 => uint256) private _ownedTokensIndex;

  // Array with all token ids, used for enumeration
  uint256[] private _allTokens;

  // Mapping from token id to position in the allTokens array
  mapping(uint256 => uint256) private _allTokensIndex;

  //*************DELEGATE SECTION***********************************************************************************************************/

  event TokenDelegated(uint256 indexed tokenId, address delegate);

  function delegateToken(address delegate, uint256 tokenId) public {
    require(msg.sender == ERC721.ownerOf(tokenId),'!owner');
    address currentDelegate = _delegates[tokenId];
    _transferDelegate(currentDelegate, delegate, tokenId);
  }

  // function for minting should add the token to the delegate and increase the balance
  function _addDelegate(address to, uint256 tokenId) internal {
    uint256 length = _delegateBalances[to];
    _delegatedTokens[to][length] = tokenId;
    _delegatedTokensIndex[tokenId] = length;
    _delegates[tokenId] = to;
    _delegateBalances[to] += 1;
    emit TokenDelegated(tokenId, to);
  }

  // function for burning should reduce the balances and set the token mapped to 0x0 address
  function _removeDelegate(uint256 tokenId) internal {
    address from = delegatedTo(tokenId);
    uint256 lastTokenIndex = _delegateBalances[from] - 1;
    uint256 tokenIndex = _delegatedTokensIndex[tokenId];
    if (tokenIndex != lastTokenIndex) {
      uint256 lastTokenId = _delegatedTokens[from][lastTokenIndex];
      _delegatedTokens[from][tokenIndex] = lastTokenId;
      _delegatedTokensIndex[lastTokenId] = tokenIndex;
    }
    delete _delegatedTokensIndex[tokenId];
    delete _delegatedTokens[from][lastTokenIndex];
    _delegateBalances[from] -= 1;
    _delegates[tokenId] = address(0);
  }

  // function for transfering should reduce the balances of from by 1, increase the balances of to by 1, and set the delegate address To
  function _transferDelegate(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    _removeDelegate(tokenId);
    _addDelegate(to, tokenId);
  }

  //mapping from tokenId to the delegate address
  mapping(uint256 => address) private _delegates;

  // mapping from delegate address to token count
  mapping(address => uint256) private _delegateBalances;

  // mapping from delegate to the list of delegated token Ids
  mapping(address => mapping(uint256 => uint256)) private _delegatedTokens;

  // maping from token ID to the index of the delegates token list
  mapping(uint256 => uint256) private _delegatedTokensIndex;

  function balanceOfDelegate(address delegate) public view returns (uint256) {
    require(delegate != address(0));
    return _delegateBalances[delegate];
  }

  function delegatedTo(uint256 tokenId) public view returns (address) {
    address delegate = _delegates[tokenId];
    require(delegate != address(0));
    return delegate;
  }

  function tokenOfDelegateByIndex(address delegate, uint256 index) public view returns (uint256) {
    require(index < _delegateBalances[delegate], 'out of bounds');
    return _delegatedTokens[delegate][index];
  }

  //*********************************************************************************************************************************************************************/
  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
    return interfaceId == type(IERC721Enumerable).interfaceId || super.supportsInterface(interfaceId);
  }

  /**
   * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
   */
  function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns (uint256) {
    require(index < ERC721.balanceOf(owner), 'ERC721Enumerable: owner index out of bounds');
    return _ownedTokens[owner][index];
  }

  /**
   * @dev See {IERC721Enumerable-totalSupply}.
   */
  function totalSupply() public view virtual returns (uint256) {
    return _allTokens.length;
  }

  /**
   * @dev See {IERC721Enumerable-tokenByIndex}.
   */
  function tokenByIndex(uint256 index) public view virtual returns (uint256) {
    require(index < ERC721Delegate.totalSupply(), 'ERC721Enumerable: global index out of bounds');
    return _allTokens[index];
  }

  /**
   * @dev Hook that is called before any token transfer. This includes minting
   * and burning.
   *
   * Calling conditions:
   *
   * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
   * transferred to `to`.
   * - When `from` is zero, `tokenId` will be minted for `to`.
   * - When `to` is zero, ``from``'s `tokenId` will be burned.
   * - `from` cannot be the zero address.
   * - `to` cannot be the zero address.
   *
   * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    super._beforeTokenTransfer(from, to, tokenId);

    if (from == address(0)) {
      _addTokenToAllTokensEnumeration(tokenId);
      //minting we add the delegate
      _addDelegate(to, tokenId);
    } else if (from != to) {
      _removeTokenFromOwnerEnumeration(from, tokenId);
      // transferring we transfer, but need ensure its not being burned
      if (to != address(0)) _transferDelegate(from, to, tokenId);
    }
    if (to == address(0)) {
      _removeTokenFromAllTokensEnumeration(tokenId);
      // if burned we simply remove
      _removeDelegate(tokenId);
    } else if (to != from) {
      _addTokenToOwnerEnumeration(to, tokenId);
    }
  }

  /**
   * @dev Private function to add a token to this extension's ownership-tracking data structures.
   * @param to address representing the new owner of the given token ID
   * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
   */
  function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
    uint256 length = ERC721.balanceOf(to);
    _ownedTokens[to][length] = tokenId;
    _ownedTokensIndex[tokenId] = length;
  }

  /**
   * @dev Private function to add a token to this extension's token tracking data structures.
   * @param tokenId uint256 ID of the token to be added to the tokens list
   */
  function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
    _allTokensIndex[tokenId] = _allTokens.length;
    _allTokens.push(tokenId);
  }

  /**
   * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
   * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
   * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
   * This has O(1) time complexity, but alters the order of the _ownedTokens array.
   * @param from address representing the previous owner of the given token ID
   * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
   */
  function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
    // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
    // then delete the last slot (swap and pop).

    uint256 lastTokenIndex = ERC721.balanceOf(from) - 1;
    uint256 tokenIndex = _ownedTokensIndex[tokenId];

    // When the token to delete is the last token, the swap operation is unnecessary
    if (tokenIndex != lastTokenIndex) {
      uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

      _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
      _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
    }

    // This also deletes the contents at the last position of the array
    delete _ownedTokensIndex[tokenId];
    delete _ownedTokens[from][lastTokenIndex];
  }

  /**
   * @dev Private function to remove a token from this extension's token tracking data structures.
   * This has O(1) time complexity, but alters the order of the _allTokens array.
   * @param tokenId uint256 ID of the token to be removed from the tokens list
   */
  function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
    // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
    // then delete the last slot (swap and pop).

    uint256 lastTokenIndex = _allTokens.length - 1;
    uint256 tokenIndex = _allTokensIndex[tokenId];

    // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
    // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
    // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
    uint256 lastTokenId = _allTokens[lastTokenIndex];

    _allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
    _allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

    // This also deletes the contents at the last position of the array
    delete _allTokensIndex[tokenId];
    _allTokens.pop();
  }
}
