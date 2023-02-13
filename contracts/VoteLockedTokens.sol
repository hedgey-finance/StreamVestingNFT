// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

interface Governor {
    function castVote()
}


/// @notice this is a small contract that will allow owners of locked token NFTs to vote on-chain with their balances
/// this works when someone wants to vote they must initialize a new voting contract
/// which pulls their locked balances into the contract
/// the tokens are managed by the NFT contract and can pull them back at any time

contract VoteLockedTokens {
    using SafeERC20 for IERC20;

    address public hedgey;
    uint public tokenId;
    address public token;
    address public votingContract;
    address public delegationContract;

    constructor(address _token, uint _tokenId, address _votingContract, address _delegationContract) {
        hedgey = msg.sender;
        tokenId = _tokenId;
        token = _token;
        votingContract = _votingContract;
        delegationContract = _delegationContract;
    }

    function castVote(uint proposalId, bool support) external {
        address nftOwner = IERC721(hedgey).ownerOf(tokenId);
        require(msg.sender == nftOwner || msg.sender == hedgey);
        castVote();
    }

}