const { constants, utils } = require('ethers')
const { ethers } = require('hardhat')
const assert = require('assert')

// Deploying Registry
// Deployed Registry at 0x6A1E3042922E0252befBD385Ee35ce48A9806904
// Deploying Registrar
// Deployed Registrar at 0x79EAFe3655C0E94b0CE180E76a4bBa4B3ED24555
// Deploying Reverse Registrar
// Deployed Reverse Registrar at 0x6D33498AF82D2D667e2626fCbbf56685161c2F5a
// Deployed Resolver at 0x1a9522C0C88060cDb59AABA2c52648f19aCc7329
// Registered dtcc.eth to 0x4C5F0f90a2D4b518aFba11E22AC9b8F6B031d204
// Set subdomain owner for zach.dtcc.eth
// Set Public Resolver for zach.dtcc.eth to 0x1a9522C0C88060cDb59AABA2c52648f19aCc7329
// Set forward record for zach.dtcc.eth to 0x41D42c2DE07000f286CbFa1c17b2A5FA5f105656
// Set reverse record for 0x41D42c2DE07000f286CbFa1c17b2A5FA5f105656 to zach.dtcc.eth
// Set subdomain owner for wallet.dtcc.eth
// Set resolver for dtcc.eth to 0x1a9522C0C88060cDb59AABA2c52648f19aCc7329
// Set forward record for wallet.dtcc.eth to 0x720888D077b1561E3185D48A7539AEA745F33A38
// Set reverse record for 0x720888D077b1561E3185D48A7539AEA745F33A38 to wallet.dtcc.eth

const tld = 'eth'
const ensRegistryAddress = '0xC00890a3B0E065e222112348BC81A2AA97bb6e18' // dummy address - change to real address
const registrarAddress = '0xe93E918511f380215C8F399ce376dA17181531A2' // dummy address - change to real address
const reverseRegistrarAddress = '0x69907dF7057d58BF26E337dE3E1262d04f766B7a' // dummy address - change to real address
const publicResolverAddress = '0x1689fD1075278D2Ce44fe9ED8562217a68953EF2' // dummy address - change to real address

const batchData = [
  {
    name: 'dtcc',
    subdomains: [
      // {
      //     name: 'sterling-bank',
      //     address: '0x842dad142150b4a6f90d395e535788447f4c6bb7',
      //   },
      //   {
      //     name: 'bravo-bank',
      //     address: '0x50e5305a35a9b88c66e118ebf33091d7bb5a47e7',
      //   },
      //   {
      //     name: 'margincore-nyc',
      //     address: '0x9cc3f151c2d97c58bed47315b573e6f1572fa520',
      //   },
      //   {
      //     name: 'euroclear-triparty',
      //     address: '0x7b4385a0b26b76faea2fb6e1f72de2538ed49df9',
      //   },
      //   {
      //     name: 'yan-asset-management',
      //     address: '0x60a85b0f417c8a6bf09b217cac4befc4f1492f18',
      //   },
      //   {
      //     name: 'bny-triparty',
      //     address: '0x1c6e366685359ca4b869bdc80bbcc04b81bfdbf9',
      //   },
      // {
      //     name: 'testuat',
      //     address: '0xf71d93b72b7ca6c12d9deb0a0ace7af31ae889f3',
      // }
      //   {
      //     name: 'cryptoex',
      //     address: '0x951b0641c357e0aad856ca41a150b38a8b4f691d',
      //   },
      //   {
      //     name: 'sterling-bank',
      //     address: '0x842dad142150b4a6f90d395e535788447f4c6bb7',
      //   },
      //   {
      //     name: 'yan-asset-management',
      //     address: '0x60a85b0f417c8a6bf09b217cac4befc4f1492f18',
      //   },
      //   {
      //     name: 'bravo-bank',
      //     address: '0x50e5305a35a9b88c66e118ebf33091d7bb5a47e7',
      //   },
      //   {
      //     name: 'margincore-paris',
      //     address: '0x662d31d5af0d02584b4a5b35c8de48d070eabf35',
      //   },
      //   {
      //     name: 'margincore-nyc',
      //     address: '0x9cc3f151c2d97c58bed47315b573e6f1572fa520',
      //   },
      //   {
      //     name: 'margincore-tokyo',
      //     address: '0xeccc63c433888cd935b6f8ffb35b002e7713e45e',
      //   },
      //   {
      //     name: 'margincore-london',
      //     address: '0x3e9656d162fc862c6b835c12f99c1a0330f1a392',
      //   },
      //   {
      //     name: 'bny',
      //     address: '0x8cf93ce31e08cb7d4d42b182806e345fe0e8ca76',
      //   },
      //   {
      //     name: 'euroclear',
      //     address: '0xbf25f690273950a615eb82b817d60be9948c3b5a',
      //   },
      //   {
      //     name: 'bank-of-japan',
      //     address: '0x119d451b0f1580dbb2c84d7a775dbadd1fc78a66',
      //   },
      //   {
      //     name: 'clearstream',
      //     address: '0xf65ec04076288ab07d0f3315ece45fb637c48ea9',
      //   },
      //   {
      //     name: 'wellington',
      //     address: '0x2054c8205e5e13d635b6e73cf6906999fb382624',
      //   },
      //   {
      //     name: 'jpx',
      //     address: '0xd14c1bd93f05e28788f65cf03a9b721690ef4eee',
      //   },
      //   {
      //     name: 'bny-triparty',
      //     address: '0x1c6e366685359ca4b869bdc80bbcc04b81bfdbf9',
      //   },
      //   {
      //     name: 'euroclear-triparty',
      //     address: '0x7b4385a0b26b76faea2fb6e1f72de2538ed49df9',
      //   },
      //   {
      //     name: 'ubs',
      //     address: '0xebfa3014e1f535771e5cf7cf1ee51d18ec5f2313',
      //   },
      //   {
      //     name: 'socgen',
      //     address: '0x04bdc77d17de2de1c30c27243da5fe5ecf0a152b',
      //   },
      //   {
      //     name: 'ficc',
      //     address: '0x60d7d1f51d9742c772b26e6272f1f6f33e5a6e9c',
      //   },
      //   {
      //     name: 'nscc',
      //     address: '0xd605f159556c5c2b6cc955a3b175a79ed19e4be3',
      //   },
      //   {
      //     name: 'jasdec',
      //     address: '0x139c2e6f1efb02c188f8422bec640632b416544d',
      //   },
      //   {
      //     name: 'dtcc',
      //     address: '0x005afdaa7899a8beb24fdff96d2899eb072c19a7',
      //   },
    ],
  },
]

async function main() {
  // Get the ENSRegistry contract
  const ENSRegistry = await ethers.getContractAt(
    'ENSRegistry',
    ensRegistryAddress,
  )
  const PublicResolver = await ethers.getContractAt(
    'PublicResolver',
    publicResolverAddress,
  )
  const ReverseRegistrar = await ethers.getContractAt(
    'IReverseRegistrar',
    reverseRegistrarAddress,
  )
  const FIFSRegistrar = await ethers.getContractAt(
    'FIFSRegistrarWithExpiration',
    registrarAddress,
  )

  for (const entry of batchData) {
    let tx
    let [deployer] = await ethers.getSigners()

    try {
      for (const subdomain of entry.subdomains) {
        const subdomainNamehash = utils.namehash(
          `${subdomain.name}.${entry.name}.${tld}`,
        )
        //Set name record
        tx = await PublicResolver.connect(deployer)['setName(bytes32,string)'](
          subdomainNamehash,
          `${subdomain.name}.${entry.name}.${tld}`,
        )

        await tx.wait()

        console.log(
          `Set name for ${subdomainNamehash} to ${subdomain.name}.${entry.name}.${tld}`,
        )

        console.log(deployer.address)

        // tx = await ENSRegistry.connect(deployer).setSubnodeOwner(
        //   utils.namehash(`${entry.name}.${tld}`),
        //   utils.id(subdomain.name),
        //   deployer.address,
        //   { gasLimit: 1000000 },
        // )

        // await tx.wait()

        // console.log(
        //   'Set subnode owner for',
        //   `${subdomain.name}.${entry.name}.${tld}`,
        // )

        // // Set resolver for subdomain
        // tx = await ENSRegistry.connect(deployer).setResolver(
        //   subdomainNamehash,
        //   publicResolverAddress,
        // )

        // await tx.wait()

        // console.log(`Set resolver for ${subdomain.name}.${entry.name}.${tld}`)

        // //Set forward record
        // tx = await PublicResolver.connect(deployer)['setAddr(bytes32,address)'](
        //   subdomainNamehash,
        //   subdomain.address,
        // )

        // await tx.wait()

        // console.log(
        //   `Set forward record for ${subdomain.name}.${entry.name}.${tld} to ${subdomain.address}`,
        // )
        // // console.log(ReverseRegistrar.address)

        // tx = await ReverseRegistrar.connect(accounts[i]).setNameForAddr(
        //   subdomain.address,
        //   subdomain.address,
        //   publicResolverAddress,
        //   `${subdomain.name}.${entry.name}.${tld}`
        // )

        // we do the configuration and set the reverse registrar as the owner
        //   await hre.deployments.execute(
        //     'ENSRegistry',
        //     { from: deployer.address },
        //     'setSubnodeOwner',
        //     utils.namehash('reverse'),
        //     utils.id('addr'),
        //     reverseRegistrar.address,
        //   )
        // }

        // tx = await ENSRegistry.setSubnodeOwner(
        //     utils.namehash('reverse'),
        //     utils.id('addr'),
        //     ReverseRegistrar.address,
        // )
        // await tx.wait();

        // tx = await ReverseRegistrar.connect(deployer).setNameForAddr(
        //   subdomain.address,
        //   subdomain.address,
        //   publicResolverAddress,
        //   `${subdomain.name}.${entry.name}.${tld}`,
        // )

        // await tx.wait()

        // console.log(
        //   `Set reverse record for ${subdomain.address} to ${subdomain.name}.${entry.name}.${tld}`,
        // )

        // Read and log forward and reverse records
        // const forwardName = `${subdomain.name}.${entry.name}.${tld}`
        // const forwardResolver = await ENSRegistry.resolver(
        //   utils.namehash(forwardName),
        // )
        // const forwardRecord = await PublicResolver['addr(bytes32)'](
        //   utils.namehash(forwardName),
        // )
        // console.log('')
        // console.log('Forward Name:', forwardName)
        // console.log('Forward Resolver:', forwardResolver)
        // console.log('Forward Record:', forwardRecord)

        // const reverseName = `${forwardRecord
        //   .slice(2)
        //   .toLowerCase()}.addr.reverse`

        // const reverseResolver = await ENSRegistry.resolver(
        //   utils.namehash(reverseName),
        // )

        // console.log('')

        // console.log('Reverse Name:', reverseName)
        // console.log('Reverse Resolver:', reverseResolver)

        // const publicReverseResolver = await ethers.getContractAt(
        //   'PublicResolver',
        //   reverseResolver,
        // )
        // const reverseRecord = await publicReverseResolver.name(
        //   utils.namehash(reverseName),
        // )
        // console.log('Reverse Record:', reverseRecord)

        // const domainName = await publicReverseResolver.name(
        //   utils.namehash(reverseName),
        // )
        // console.log('')

        // console.log('Domain Name Registered Is: ', domainName)
      }
    } catch (error) {
      console.error(`Error processing ${entry.name}.${tld}:`, error)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
