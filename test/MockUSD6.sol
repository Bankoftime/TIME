// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSD6 is ERC20 {
    constructor()  ERC20 ('USD6', 'USD6') {
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function mint(address _address, uint256 amount) public {
        _mint(_address, amount);
    }
}
