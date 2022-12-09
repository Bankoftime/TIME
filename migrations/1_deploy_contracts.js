const MockUSD6 = artifacts.require("MockUSD6")
const MockUSD18 = artifacts.require("MockUSD18")
const TIME = artifacts.require("TIME")

module.exports = async (deployer, network) => {
    if (network == "test") {
        // Deploy MockUSD6 contract for 6 decimals
        await deployer.deploy(MockUSD6)
        // Deploy MockUSD18 contract for 18 decimals
        await deployer.deploy(MockUSD18)
        // Deploy the TIME contract as our only task
        await deployer.deploy(TIME, MockUSD6.address, 6, MockUSD18.address, 18, MockUSD18.address, 18)
    }
}