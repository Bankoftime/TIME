// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ABDKMath64x64.sol";

contract TIME is ERC20 {

    /* TIME starts at $1 on 2023 Jan 1, grows 1+1=2 every year until 2042 Dec 2, and stablizes at $1000000.013139219573684269 */

    mapping(address => bool) public isUSD;
    mapping(address => uint256) public Decimails;
    uint256 public constant launchTime = 1672531200; /* 2023 Jan 01 00:00:00 GMT+0000 */
    uint256 public constant stableTime = 2301093147; /* 2042 Dec 2 00:32:27 GMT+0000 */
    uint256 public constant stablePrice = 1e6 * 1e18; /* Price will be stable at 1,000,000 */

    constructor(address usd1, uint256 usd1decimails, address usd2, uint256 usd2decimails, address usd3, uint256 usd3decimails) ERC20 ('TIME', 'TIME') {
        isUSD[usd1] = true;
        Decimails[usd1] = usd1decimails;
        isUSD[usd2] = true;
        Decimails[usd2] = usd2decimails;
        isUSD[usd3] = true;
        Decimails[usd3] = usd3decimails;
    }

    function convertUSDToTIME(uint256 amount, uint256 decimals) public pure returns (uint256) {
        if (decimals == 6) return amount * 1e12;

        return amount;
    }

    function convertTIMEToUSD(uint256 usd, uint256 decimals) public pure returns (uint256) {
        if (decimals == 6) return usd / 1e12;

        return usd;
    }

    function getPrice() public view returns (uint256) {
        uint256 ticktock;

        /* TIME price stablizes at $1 before 2023 Jan 1 */
        if (block.timestamp <= launchTime) return 1e18;
        /* TIME price stablizes at $1000000 after 2042 Dec 2 */
        if (block.timestamp >= stableTime) return stablePrice;

        ticktock = block.timestamp - launchTime;

        /**
         * The current price of TIME is always 2X of the price 365 days ago
         *   y = 2.000^(ticktock / 365 days)
         */
        int128 power = ABDKMath64x64.divu(ticktock, 365 days);

        /**
         * Since ABDKMath64x64 only supports exp(x) and exp_2(x) functions and pow(x,y) function only takes non-negative integer power.
         * Following is the equivalent equation for implementing exp_a(x) where both base and power are arbitrary fixed point number.
         * Basic logarithm rule:
         *   x = a^(log_a(x))
         * And deduce it:
         *   x^y = a^(y*log_a(x))
         *   x^y = 2^(y*log_2(x)), if a equals 2
         *   x^y = exp(y*ln(x)), if a equals e
         */
        // int128 base = ABDKMath64x64.fromUInt(2);
        // int128 price = ABDKMath64x64.exp_2(ABDKMath64x64.mul(power, ABDKMath64x64.log_2(base)));
        // int128 price = ABDKMath64x64.exp(ABDKMath64x64.mul(power, ABDKMath64x64.ln(base)));

        // We can simply adopt exp_2(x) function because base equals 2.
        int128 price = ABDKMath64x64.exp_2(power);
        // Convert decimal places to TIME
        uint256 timePrice = ABDKMath64x64.mulu(price, 1e18);
        // Restrict highest price
        if (timePrice < stablePrice) {
            return timePrice;
        } else {
            return stablePrice;
        }
    }

    function Buy(address usd, uint256 amount) external returns (bool) {
        require(isUSD[usd], 'USD ERROR');

        IERC20(usd).transferFrom(msg.sender, address(this), amount);

        amount = convertUSDToTIME(amount, Decimails[usd]);
        uint256 time = amount * 1e18 / getPrice();

        _mint(msg.sender, time);

        return true;
    }

    function Sell(address usd, uint256 time) external returns (bool) {
        require(isUSD[usd], 'USD ERROR');

        uint256 _usd = time * getPrice() / 1e18;
        _usd = convertTIMEToUSD(_usd, Decimails[usd]);

        require(IERC20(usd).balanceOf(address(this)) >= _usd, "Insufficient USD");

        _burn(msg.sender, time);
        IERC20(usd).transfer(msg.sender, _usd);

        return true;
    }
}
