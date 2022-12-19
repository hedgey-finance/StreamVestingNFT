// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Token is ERC20 {
  uint8 private _decimals;

  constructor(uint256 initialSupply, uint8 tokenDecimals, string memory name, string memory symbol) ERC20(name, symbol) {
    _decimals = tokenDecimals;
    _mint(msg.sender, initialSupply);
  }

  function mintToOwner(uint256 amount) public {
    _mint(msg.sender, amount);
  }

  function decimals() public view virtual override returns (uint8) {
    return _decimals;
  }
}
