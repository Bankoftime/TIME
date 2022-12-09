// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSD18 is ERC20 {
    constructor()  ERC20 ('USD18', 'USD18') {
    }

    function mint(address _address, uint256 amount) public {
        _mint(_address, amount);
    }
}
