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
const ensRegistryAddress = '0x6A1E3042922E0252befBD385Ee35ce48A9806904' // dummy address - change to real address
const registrarAddress = '0x79EAFe3655C0E94b0CE180E76a4bBa4B3ED24555' // dummy address - change to real address
const reverseRegistrarAddress = '0x6D33498AF82D2D667e2626fCbbf56685161c2F5a' // dummy address - change to real address
const publicResolverAddress = '0x1a9522C0C88060cDb59AABA2c52648f19aCc7329' // dummy address - change to real address

const batchData = [
  {
    name: 'dtcc',
    subdomains: [
      {
        name: 'margincore-ny',
        address: '0x14D6F2201FC8c8cfd65Dd349dD53d165198C22f7',
      },
      {
        name: 'margincore-tokyo',
        address: '0x803B307bbEcB8D8E55959C0F21cD6a5E008D58Ef',
      },
      {
        name: 'margincore-paris',
        address: '0x81f845B586fFf45C68F01D2B4d9c0DB727a8cE3d',
      },
      {
        name: 'bravo-bank',
        address: '0x88Cf1538EEB86462C2AC66702A80cC6a8EC4fD04',
      },
      {
        name: 'socgen',
        address: '0x93f0BC752C988aB66DEA14dD8Aa6176b2B511381',
      },
      {
        name: 'wellington',
        address: '0xaEbA76b426fEE6680872a84942fda1bC4D1A87Ef',
      },
      {
        name: 'bank-of-america',
        address: '0x6774f079Dd360cf228d09737BC3657B8672bABBB',
      },
      {
        name: 'sterling-bank',
        address: '0xfABB6B1528B83D91941c3CB58e7954522c24d8CA',
      },
      {
        name: 'fidelity',
        address: '0xce1279683e3A060Df76E72f0D1717CF95D42Be9b',
      },
      {
        name: 'ficc',
        address: '0x37a7F8B45f7dCCC4d88eCf8B8866F056a512395F',
      },
      {
        name: 'nscc',
        address: '0x801839DebB7061406EF738d507D05830F2fF43f1',
      },
      {
        name: 'jscc',
        address: '0x01d2D3da7a42F64e7Dc6Ae405F169836556adC86',
      },
      {
        name: 'crypto-ex1',
        address: '0x57122554635EF92adC3c9252Ea996ce9Fb72537C',
      },
      {
        name: 'dtcc-da',
        address: '0xc31a19c17981b6ACd925Af8c8F5BF7a63aeAA028',
      },
      {
        name: 'dtcc',
        address: '0x9300787cFe46c0468cca4aa1b439fa627FAa28C7',
      },
      {
        name: 'bny',
        address: '0xF466381A18b44Ef898B3e95d616A8Cae53a560D0',
      },
      {
        name: 'euroclear',
        address: '0x1BE6Fe727aCD01f86ab5b5C7b57d42152c4CB771',
      },
      {
        name: 'blackrock',
        address: '0xAF0AD51DaD551833495cD679344D71fB6990d3a2',
      },
      {
        name: 'crypto-ex2',
        address: '0xfaB5663a0d7F277F926381B5B5b1C2078288700E',
      },
      {
        name: 'jp-morgan',
        address: '0x4ea3efe0207a9A208C0da93A3f9A7A898393fe4D',
      },
      {
        name: 'margincore-london',
        address: '0x9d1aE6d84e3A385e667CeE70d4dFe29Ff0ea7605',
      },
      {
        name: 'yan-asset-manager',
        address: '0xbB22D30cF7075339FbbC12035AFBd8aa23C7f355',
      },
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
