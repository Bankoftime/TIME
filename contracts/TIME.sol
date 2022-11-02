// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ABDKMath64x64.sol";

contract TIME is ERC20 {

    /* TIME starts at $1 on 2023 Jan 1, grows 1+1=2 every year until 2050 Dec 31, and stablizes at $271769482.082689087500541747 */

    mapping(address => bool) public isUSD;
    mapping(address => uint256) public Decimails;
    uint256 public constant launchTime = 1672531200; /* 2023 Jan 01 00:00:00 GMT+0000 */
    uint256 public constant stableTime = 2556100800; /* 2050 Dec 31 12:00:00 GMT+0000 */

    constructor(address usd1, uint256 usd1decimails, address usd2, uint256 usd2decimails, address usd3, uint256 usd3decimails) ERC20 ('TIME', 'TIME') {
        isUSD[usd1] = true;
        Decimails[usd1] = usd1decimails;
        isUSD[usd2] = true;
        Decimails[usd2] = usd2decimails;
        isUSD[usd3] = true;
        Decimails[usd3] = usd3decimails;
    }

    function convert6To18(uint256 amount, uint256 decimals) public pure returns (uint256) {
        if(decimals == 6) return amount * 1e12;

        return amount;
    }

    function convert18To6(uint256 usd, uint256 decimals) public pure returns (uint256) {
        if(decimals == 6) return usd / 1e12;

        return usd;
    }

    function getPrice() public view returns (uint256) {
        uint256 ticktock;

        if(block.timestamp <= launchTime)
            return 1000000000000000000;
        if(block.timestamp >= stableTime)
            return 271769482082689087500541747;

        ticktock = block.timestamp - launchTime;
      
        /**
         * The current price of TIME is always 2X of the price 365 days ago
         *   y = 2.000^(ticktock / 365 days)
         */
        int128 base = ABDKMath64x64.div(ABDKMath64x64.fromUInt(2000), ABDKMath64x64.fromUInt(1000));
        int128 exponential = ABDKMath64x64.div(ABDKMath64x64.fromUInt(ticktock), ABDKMath64x64.fromUInt(365 days));

        /**
         * Basic logarithm rule:
         *   x = a^(log_a(x))
         * And deduce it:
         *   x^y = a^(y*log_a(x))
         * When a equals 2
         *   x^y = 2^(y*log_2(x))
         */
        return ABDKMath64x64.mulu(ABDKMath64x64.exp_2(ABDKMath64x64.mul(exponential, ABDKMath64x64.log_2(base))), 1 ether);
    }

    function Buy(address usd, uint256 amount) external returns (bool) {
        require(isUSD[usd], 'USD ERROR');

        IERC20(usd).transferFrom(msg.sender, address(this), amount);

        amount = convert6To18(amount, Decimails[usd]);
        uint256 time = amount * 1 ether / getPrice();
        
        _mint(msg.sender, time);

        return true;
    }

    function Sell(address usd, uint256 time) external returns (bool) {
        require(isUSD[usd], 'USD ERROR');

        _burn(msg.sender, time);

        uint256 _usd = time * getPrice() / 1 ether;
        _usd = convert18To6(_usd, Decimails[usd]);

        IERC20(usd).transfer(msg.sender, _usd);

        return true;
    }
}
