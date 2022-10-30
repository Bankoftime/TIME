const { ethers } = require('hardhat')

const verify = async address => {
  console.log('Verifying:', address)
  try {
    await run('verify:verify', {
        address: address
    })
  } catch(error) {
    if(error.message.toLowerCase().includes('already verified')) {
        console.log('Verified:', address)
    } else {
        console.log(error)
    }
  }
}

const main = async () => {

  /**
   * TODO: must set
   * @launchtime (uint256) | number - Launch time
   * @usd1 (address) | string - Address of usd1
   * @usd1decimails (uint256) | number - Decimails of usd1
   * @usd2 (address) | string - Address of usd2
   * @usd2decimails (uint256) | number - Decimails of usd2
   * @usd3 (address) | string - Address of usd3
   * @usd3decimails (uint256) | number - Decimails of usd3
   */

  const launchtime = 0
  const usd1 = '0x000000...'
  const usd1decimails = 0
  const usd2 = '0x000000...'
  const usd2decimails = 0
  const usd3 = '0x000000...'
  const usd3decimails = 0

  const TIME = await (await ethers.getContractFactory('TIME')).deploy(launchtime, usd1, usd1decimails, usd2, usd2decimails, usd3, usd3decimails)

  console.log('TIME deployed to:', TIME.address)
  await verify(TIME.address)

  console.log('Launch time:', launchtime)

  console.log('USD1:', usd1)
  console.log('USD1 decimails:', usd1decimails)
  console.log('USD2:', usd2)
  console.log('USD2 decimails:', usd2decimails)
  console.log('USD3:', usd3)
  console.log('USD3 decimails:', usd3decimails)

  console.log('Everything is done well!')
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });