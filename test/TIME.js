const MockUSD6 = artifacts.require("MockUSD6")
const MockUSD18 = artifacts.require("MockUSD18")
const TIME = artifacts.require("TIME")
const timeHelper = require('./helpers/time')
const {shouldThrow} = require('./helpers/utils')

const setBlockTime = (year, month, date, hours = 0, min = 0, sec = 0, ms = 0) => {
    const blockTime = new Date()
    blockTime.setUTCFullYear(year, month, date)
    blockTime.setUTCHours(hours, min, sec, ms)
    timeHelper.set(blockTime.getTime())
}

contract("TIME", function (accounts) {
    let mockUSD6Instance
    let mockUSD18Instance
    let timeInstance
    beforeEach(async () => {
        mockUSD6Instance = await MockUSD6.new()
        mockUSD18Instance = await MockUSD18.new()
        timeInstance = await TIME.new(mockUSD6Instance.address, 6, mockUSD18Instance.address, 18, mockUSD18Instance.address, 18)
    })
    context('with the conversion from USD to TIME', () => {
        expectedTime = web3.utils.toBN('25000000000000000000') // 25e18
        it('should convert USD which has 6 decimal places to TIME', async () => {
            const timeAmount = await timeInstance.convertUSDToTIME.call(25e6, 6)
            expect(timeAmount).to.eql(expectedTime)
        })
        it('should convert USD which has 18 decimal places to TIME', async () => {
            const timeAmount = await timeInstance.convertUSDToTIME.call(web3.utils.toBN('25000000000000000000'), 18) // 25e18
            expect(timeAmount).to.eql(expectedTime)
        })
    })
    context('with the conversion from TIME to USD', () => {
        timeAmount = web3.utils.toBN('25000000000000000000') // 25e18
        it('should convert TIME to USD which has 6 decimal places', async () => {
            const usdAmount = await timeInstance.convertTIMEToUSD.call(timeAmount, 6)
            expect(usdAmount).to.eql(web3.utils.toBN('25000000')) // 25e6
        })
        it('should convert USD which has 18 decimal places to TIME', async () => {
            const usdAmount = await timeInstance.convertTIMEToUSD.call(timeAmount, 18)
            expect(usdAmount).to.eql(web3.utils.toBN('25000000000000000000')) // 25e18
        })
    })
    context('with the calculation of price', () => {
        it('should be 1e18 before 2023', async () => {
            setBlockTime(2022, 0, 1)

            const price = await timeInstance.getPrice.call()
            expect(price).to.eql(web3.utils.toBN('1000000000000000000'))

        })
        it('should be 1e18 at 00:00:00 Jan 1, 2023', async () => {
            setBlockTime(2023, 0, 1)

            const price = await timeInstance.getPrice.call()
            expect(price).to.eql(web3.utils.toBN('1000000000000000000'))
        })
        it('should be 1996205537303189268 at 00:00:00 Dec 31, 2023', async () => {
            setBlockTime(2023, 11, 31)

            const price = await timeInstance.getPrice.call()
            expect(price).to.eql(web3.utils.toBN('1996205537303189268'))
        })
        it('should be 999957219864800405848853 at 00:00:00 Dec 2, 2042', async () => {
            setBlockTime(2042, 11, 2)

            const price = await timeInstance.getPrice.call()
            expect(price).to.eql(web3.utils.toBN('999957219864800405848853'))
        })
        it('should be 1000000e18 at 00:32:27, Dec 2, 2042', async () => {
            setBlockTime(2042, 11, 2, 0, 32, 27, 0)

            const price = await timeInstance.getPrice.call()
            expect(price).to.eql(web3.utils.toBN('1000000000000000000000000'))
        })
        it('should be 1000000e18 at 00:00:00, Jan 1, 2043', async () => {
            setBlockTime(2043, 0, 1)

            const price = await timeInstance.getPrice.call()
            expect(price).to.eql(web3.utils.toBN('1000000000000000000000000'))
        })
    })
    context('with Buy function', () => {
        it('should buy 10 TIME by 20 USD on MockUSD6 chain at Jan 1, 2024 ', async () => {
            setBlockTime(2024, 0, 1)

            const usdAmount = web3.utils.toBN('20000000') // 20e6
            await mockUSD6Instance.mint(accounts[0], usdAmount)
            await mockUSD6Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            await timeInstance.Buy(mockUSD6Instance.address, usdAmount, {from: accounts[0]})
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(web3.utils.toBN('10000000000000000000')) // 10e18
            const usdTotalSupply = await mockUSD6Instance.balanceOf.call(timeInstance.address)
            expect(usdTotalSupply).to.eql(usdAmount)
        })
        it('should buy 10 TIME by 20 USD on MockUSD18 chain at Jan 1, 2024 ', async () => {
            setBlockTime(2024, 0, 1)

            const usdAmount = web3.utils.toBN('20000000000000000000') // 20e18
            await mockUSD18Instance.mint(accounts[0], usdAmount)
            await mockUSD18Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            await timeInstance.Buy(mockUSD18Instance.address, usdAmount, {from: accounts[0]})
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(web3.utils.toBN('10000000000000000000')) // 10e18
            const usdTotalSupply = await mockUSD18Instance.balanceOf.call(timeInstance.address)
            expect(usdTotalSupply).to.eql(usdAmount)
        })
        it('should not buy any TIME if buyer has not enough USD on all MockUSD chains', async () => {
            const usdAmount = 20e6
            await mockUSD6Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            await mockUSD18Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            shouldThrow(timeInstance.Buy(mockUSD6Instance.address, usdAmount, {from: accounts[0]}))
            shouldThrow(timeInstance.Buy(mockUSD18Instance.address, usdAmount, {from: accounts[0]}))
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(web3.utils.toBN('0'))
            const usd6TotalSupply = await mockUSD6Instance.balanceOf.call(timeInstance.address)
            expect(usd6TotalSupply).to.eql(web3.utils.toBN('0'))
            const usd18TotalSupply = await mockUSD6Instance.balanceOf.call(timeInstance.address)
            expect(usd18TotalSupply).to.eql(web3.utils.toBN('0'))
        })
    })
    context('with Sell function', () => {
        it('should sell 4 TIME then receive 8 USD on MockUSD6 chain at Jan 1, 2024', async () => {
            // buy 10 TIME by 10 USD at launch time
            setBlockTime(2023, 0, 1)
            const usdAmount = web3.utils.toBN('10000000') // 10e6
            await mockUSD6Instance.mint(accounts[0], usdAmount)
            await mockUSD6Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            await timeInstance.Buy(mockUSD6Instance.address, usdAmount, {from: accounts[0]})
            // sell 10 TIME at 00:00:00 Jan 1, 2024
            setBlockTime(2024, 0, 1)
            await timeInstance.Sell(mockUSD6Instance.address, web3.utils.toBN('4000000000000000000')) // 4e18
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(web3.utils.toBN('6000000000000000000')) // 6e18
            const usdBalance = await mockUSD6Instance.balanceOf.call(accounts[0])
            expect(usdBalance).to.eql(web3.utils.toBN('8000000')) // 8e6
            const usdTotalSupply = await mockUSD6Instance.balanceOf.call(timeInstance.address)
            expect(usdTotalSupply).to.eql(web3.utils.toBN('2000000')) //2e6
        })
        it('should sell 4 TIME then receive 8 USD on MockUSD18 chain at Jan 1, 2024', async () => {
            // buy 10 TIME by 10 USD at launch time
            setBlockTime(2023, 0, 1)
            const usdAmount = web3.utils.toBN('10000000000000000000') // 10e18
            await mockUSD18Instance.mint(accounts[0], usdAmount)
            await mockUSD18Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            await timeInstance.Buy(mockUSD18Instance.address, usdAmount, {from: accounts[0]})
            // sell 10 TIME at 00:00:00 Jan 1, 2024
            setBlockTime(2024, 0, 1)
            await timeInstance.Sell(mockUSD18Instance.address, web3.utils.toBN('4000000000000000000')) // 4e18
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(web3.utils.toBN('6000000000000000000')) // 6e18
            const usdBalance = await mockUSD18Instance.balanceOf.call(accounts[0])
            expect(usdBalance).to.eql(web3.utils.toBN('8000000000000000000')) // 8e18
            const usdTotalSupply = await mockUSD18Instance.balanceOf.call(timeInstance.address)
            expect(usdTotalSupply).to.eql(web3.utils.toBN('2000000000000000000')) //2e18
        })
        it('should not sell any TIME if seller has not enough TIME', async () => {
            const timeAmount = web3.utils.toBN('10000000000000000000') // 10e18
            shouldThrow(timeInstance.Sell(mockUSD6Instance.address, timeAmount))
            shouldThrow(timeInstance.Sell(mockUSD18Instance.address, timeAmount))
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(web3.utils.toBN('0'))
            const usd6TotalSupply = await mockUSD6Instance.balanceOf.call(accounts[0])
            expect(usd6TotalSupply).to.eql(web3.utils.toBN('0'))
            const usd18TotalSupply = await mockUSD6Instance.balanceOf.call(accounts[0])
            expect(usd18TotalSupply).to.eql(web3.utils.toBN('0'))
        })
        it('should not sell any TIME if TimeContract has not enough USD on MockUSD6 chain', async () => {
            // buy 10 TIME by 10 USD at launch time
            setBlockTime(2023, 0, 1)
            const usdAmount = web3.utils.toBN('10000000') // 10e6
            const timeAmount = web3.utils.toBN('10000000000000000000') // 10e18
            await mockUSD6Instance.mint(accounts[0], web3.utils.toBN('15000000')) // 15e6
            await mockUSD6Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            await timeInstance.Buy(mockUSD6Instance.address, usdAmount, {from: accounts[0]})
            // sell 10 TIME at 00:00:00 Jan 1, 2024
            setBlockTime(2024, 0, 1)
            shouldThrow(timeInstance.Sell(mockUSD6Instance.address, timeAmount))
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(timeAmount)
            const usdBalance = await mockUSD6Instance.balanceOf.call(accounts[0])
            expect(usdBalance).to.eql(web3.utils.toBN('5000000')) // 5e6
            const usdTotalSupply = await mockUSD6Instance.balanceOf.call(timeInstance.address)
            expect(usdTotalSupply).to.eql(usdAmount)
        })
        it('should not sell any TIME if TimeContract has not enough USD on MockUSD18 chain', async ()=>{
            // buy 10 TIME by 10 USD at launch time
            setBlockTime(2023, 0, 1)
            const usdAmount = web3.utils.toBN('10000000000000000000') // 10e18
            const timeAmount = web3.utils.toBN('10000000000000000000') // 10e18
            await mockUSD18Instance.mint(accounts[0], web3.utils.toBN('15000000000000000000')) // 15e18
            await mockUSD18Instance.approve(timeInstance.address, usdAmount, {from: accounts[0]})
            await timeInstance.Buy(mockUSD18Instance.address, usdAmount, {from: accounts[0]})
            // sell 10 TIME at 00:00:00 Jan 1, 2024
            setBlockTime(2024, 0, 1)
            shouldThrow(timeInstance.Sell(mockUSD18Instance.address, timeAmount))
            const balance = await timeInstance.balanceOf.call(accounts[0])
            expect(balance).to.eql(timeAmount)
            const usdBalance = await mockUSD18Instance.balanceOf.call(accounts[0])
            expect(usdBalance).to.eql(web3.utils.toBN('5000000000000000000')) // 5e18
            const usdTotalSupply = await mockUSD18Instance.balanceOf.call(timeInstance.address)
            expect(usdTotalSupply).to.eql(usdAmount)
        })
    })
})
