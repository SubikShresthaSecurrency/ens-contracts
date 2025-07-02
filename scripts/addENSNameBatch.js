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

/// UAT
const ensRegistryAddress = '0xC00890a3B0E065e222112348BC81A2AA97bb6e18' // dummy address - change to real address
const registrarAddress = '0xe93E918511f380215C8F399ce376dA17181531A2' // dummy address - change to real address
const reverseRegistrarAddress = '0x69907dF7057d58BF26E337dE3E1262d04f766B7a' // dummy address - change to real address
const publicResolverAddress = '0x1689fD1075278D2Ce44fe9ED8562217a68953EF2' // dummy address - change to real address

/// DEV-BESU
// const ensRegistryAddress = '0x6A1E3042922E0252befBD385Ee35ce48A9806904' // dummy address - change to real address
// const registrarAddress = '0x79EAFe3655C0E94b0CE180E76a4bBa4B3ED24555' // dummy address - change to real address
// const reverseRegistrarAddress = '0x6D33498AF82D2D667e2626fCbbf56685161c2F5a' // dummy address - change to real address
// const publicResolverAddress = '0x1a9522C0C88060cDb59AABA2c52648f19aCc7329' // dummy address - change to real address

const batchData = [
  {
    name: 'blockdaemon',
    subdomains: [
      // {
      //   name: 'cryptoex',
      //   address: '0xd8c464d4d7375b76fd6858a6e8c02b46c26b2495',
      // },
      // {
      //   name: 'sterling-bank',
      //   address: '0x44ab7339d6530e50442b91c338b087e9bcc2c3c2',
      // },
      {
        name: 'yan-asset-management',
        address: '0xa633f7dc7b939f1edb3d7adbd36540e43779679a',
      },
      {
        name: 'bravo-bank',
        address: '0x3e618aebb1630500b580174d974a340bd72bd678',
      },
      {
        name: 'margincore-paris',
        address: '0x8ca41d8a274ebe7495d34b4f311a5316d7173022',
      },
      {
        name: 'margincore-nyc',
        address: '0x6a4ebdb5b05782c41ef788dd3ea5fa6ef7319e6d',
      },
      {
        name: 'margincore-tokyo',
        address: '0x00a445b6d6f957121bc292c8eaddb34d0951cb0b',
      },
      {
        name: 'margincore-london',
        address: '0x1dca2e7385dcce0c3bb4f21365ef57edef4a76b1',
      },
      {
        name: 'bny',
        address: '0xe87e01dcb9d5c2615f0cb0bc2a4df178d9ea308b',
      },
      {
        name: 'euroclear',
        address: '0x60361e714fa028e9e83f5578abf2cece70e06bfd',
      },
      {
        name: 'bank-of-japan',
        address: '0xc43d63beffebb91d8c98408de38654bb7b0c3640',
      },
      {
        name: 'clearstream',
        address: '0x0dd589afa8badb2bd63bd79e4639d37c6a06854f',
      },
      {
        name: 'wellington',
        address: '0xd01b97b11c7823413039d32a1ed8dbb52c7f9033',
      },
      {
        name: 'jpx',
        address: '0x59ef8eb9bacee1988a0bfa92db49292645e0e2c9',
      },
      {
        name: 'bny-triparty',
        address: '0xfa303dee7264057353154cfae916ce19f540de96',
      },
      {
        name: 'euroclear-triparty',
        address: '0x4dc9e176e9550d76eb74789d84e31b655ffc31f8',
      },
      {
        name: 'ubs',
        address: '0x6770cd3f177a61cf7d99301b401525fcab11bbc5',
      },
      {
        name: 'socgen',
        address: '0xa492ce538d0fdf2a84f76bdc21e8baf371eca5ff',
      },
      {
        name: 'ficc',
        address: '0x3442cbdacf8cf3d2c1ef8c346130368db826d6eb',
      },
      {
        name: 'nscc',
        address: '0xa683b8689c3d613707633b6888460a1b701e74ea',
      },
      {
        name: 'jasdec',
        address: '0xcb6322559f56ea5d2efdf4cd19636b355e006e62',
      },
      {
        name: 'dtcc',
        address: '0x4e9f588cb15f3a061f2774350fcaa2b9b3cf5c13',
      },
      {
        name: 'fidelity',
        address: '0x92ee16147024c88b6e209d51c160a204799ff331',
      },
      {
        name: 'dtcc-da',
        address: '0x03c15aed4298e55d0d4a28efc84da80d15bff7e2',
      },
      {
        name: 'franklin-templeton',
        address: '0xb34f70ead207e6f780e4f8e109881a67aed8b6df',
      },
      // {
      //   name: 'libera',
      //   address: '0x4f68348a4659c5625ab1f35dd65a9785ab23b4e2',
      // },
      // {
      //   name: 'fnality',
      //   address: '0x42b6fca6ea747455e48a43757262a77fc39f68bf',
      // },
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

        console.log(`Setting subdomain ${subdomain.name}.${entry.name}.${tld}`)

        console.log(
          `Set subdomain owner for ${subdomain.name}.${entry.name}.${tld}`,
        )

        console.log(deployer.address)

        tx = await ENSRegistry.connect(deployer).setSubnodeOwner(
          utils.namehash(`${entry.name}.${tld}`),
          utils.id(subdomain.name),
          deployer.address,
          { gasLimit: 1000000 },
        )

        await tx.wait()

        console.log(
          'Set subnode owner for',
          `${subdomain.name}.${entry.name}.${tld}`,
        )

        // Set resolver for subdomain
        tx = await ENSRegistry.connect(deployer).setResolver(
          subdomainNamehash,
          publicResolverAddress,
        )

        await tx.wait()

        console.log(`Set resolver for ${subdomain.name}.${entry.name}.${tld}`)

        //Set name record
        tx = await PublicResolver.connect(deployer)['setName(bytes32,string)'](
          subdomainNamehash,
          `${subdomain.name}.${entry.name}.${tld}`,
        )

        await tx.wait()

        console.log(
          `Set name for ${subdomainNamehash} to ${subdomain.name}.${entry.name}.${tld}`,
        )

        //Set forward record
        tx = await PublicResolver.connect(deployer)['setAddr(bytes32,address)'](
          subdomainNamehash,
          subdomain.address,
        )

        await tx.wait()

        console.log(
          `Set forward record for ${subdomain.name}.${entry.name}.${tld} to ${subdomain.address}`,
        )
        // console.log(ReverseRegistrar.address)

        // // tx = await ReverseRegistrar.connect(accounts[i]).setNameForAddr(
        // //   subdomain.address,
        // //   subdomain.address,
        // //   publicResolverAddress,
        // //   `${subdomain.name}.${entry.name}.${tld}`
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

        tx = await ReverseRegistrar.connect(deployer).setNameForAddr(
          subdomain.address,
          subdomain.address,
          publicResolverAddress,
          `${subdomain.name}.${entry.name}.${tld}`,
        )

        await tx.wait()

        console.log(
          `Set reverse record for ${subdomain.address} to ${subdomain.name}.${entry.name}.${tld}`,
        )

        // Read and log forward and reverse records
        const forwardName = `${subdomain.name}.${entry.name}.${tld}`
        const forwardResolver = await ENSRegistry.resolver(
          utils.namehash(forwardName),
        )
        const forwardRecord = await PublicResolver['addr(bytes32)'](
          utils.namehash(forwardName),
        )
        console.log('')
        console.log('Forward Name:', forwardName)
        console.log('Forward Resolver:', forwardResolver)
        console.log('Forward Record:', forwardRecord)

        const reverseName = `${forwardRecord
          .slice(2)
          .toLowerCase()}.addr.reverse`

        const reverseResolver = await ENSRegistry.resolver(
          utils.namehash(reverseName),
        )

        console.log('')

        console.log('Reverse Name:', reverseName)
        console.log('Reverse Resolver:', reverseResolver)

        const publicReverseResolver = await ethers.getContractAt(
          'PublicResolver',
          reverseResolver,
        )
        const reverseRecord = await publicReverseResolver.name(
          utils.namehash(reverseName),
        )
        console.log('Reverse Record:', reverseRecord)

        const domainName = await publicReverseResolver.name(
          utils.namehash(reverseName),
        )
        console.log('')

        console.log('Domain Name Registered Is: ', domainName)
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
