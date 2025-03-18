const { constants } = require('buffer')
const { ethers } = require('hardhat')
const utils = ethers.utils

const tld = 'dda'

const ensRegistryAddress = '0x6A1E3042922E0252befBD385Ee35ce48A9806904' // dummy address - change to real address
const registrarAddress = '0x6734e0f46B4AbB09EF8c37CbE8dB96b8178f4905' // dummy address - change to real address
const reverseRegistrarAddress = '0xd6EEaBC00479292597691f6f9A0a3b07f79c2F63' // dummy address - change to real address
const publicResolverAddress = '0x3dBdDb805BDFe2f8C42d13981467EFe72f68EDD5' // dummy address - change to real address

const batchData = [
  {
    name: 'dtcc',
    subdomains: [
      {
        name: 'MarginCoreNY',
        address: '0x14D6F2201FC8c8cfd65Dd349dD53d165198C22f7',
      },
      {
        name: 'MarginCoreTokyo',
        address: '0x803B307bbEcB8D8E55959C0F21cD6a5E008D58Ef',
      },
      {
        name: 'MarginCoreParis',
        address: '0x81f845B586fFf45C68F01D2B4d9c0DB727a8cE3d',
      },
      {
        name: 'BravoBank',
        address: '0x88Cf1538EEB86462C2AC66702A80cC6a8EC4fD04',
      },
      {
        name: 'SocGen',
        address: '0x93f0BC752C988aB66DEA14dD8Aa6176b2B511381',
      },
      {
        name: 'Wellington',
        address: '0xaEbA76b426fEE6680872a84942fda1bC4D1A87Ef',
      },
      {
        name: 'BankOfAmerica',
        address: '0x6774f079Dd360cf228d09737BC3657B8672bABBB',
      },
      {
        name: 'SterlingBank',
        address: '0xfABB6B1528B83D91941c3CB58e7954522c24d8CA',
      },
      {
        name: 'Fidelity',
        address: '0xce1279683e3A060Df76E72f0D1717CF95D42Be9b',
      },
      {
        name: 'FICC',
        address: '0x37a7F8B45f7dCCC4d88eCf8B8866F056a512395F',
      },
      {
        name: 'NSCC',
        address: '0x801839DebB7061406EF738d507D05830F2fF43f1',
      },
      {
        name: 'JSCC',
        address: '0x01d2D3da7a42F64e7Dc6Ae405F169836556adC86',
      },
      {
        name: 'CryptoEx1',
        address: '0x57122554635EF92adC3c9252Ea996ce9Fb72537C',
      },
      {
        name: 'DTCCDA',
        address: '0xc31a19c17981b6ACd925Af8c8F5BF7a63aeAA028',
      },
      {
        name: 'DTCC',
        address: '0x9300787cFe46c0468cca4aa1b439fa627FAa28C7',
      },
      {
        name: 'BNY',
        address: '0xF466381A18b44Ef898B3e95d616A8Cae53a560D0',
      },
      {
        name: 'Euroclear',
        address: '0x1BE6Fe727aCD01f86ab5b5C7b57d42152c4CB771',
      },
      {
        name: 'Blackrock',
        address: '0xAF0AD51DaD551833495cD679344D71fB6990d3a2',
      },
      {
        name: 'CryptoEx2',
        address: '0xfaB5663a0d7F277F926381B5B5b1C2078288700E',
      },
    ],
  },
]

async function main() {
  const [deployer] = await ethers.getSigners()

  // Get the ENSRegistry, PublicResolver, and ReverseRegistrar contracts
  const ENSRegistry = await ethers.getContractAt(
    'ENSRegistry',
    ensRegistryAddress,
  )
  const FIFSRegistrarWithExpiration = await ethers.getContractAt(
    'FIFSRegistrarWithExpiration',
    registrarAddress,
  )

  const PublicResolver = await ethers.getContractAt(
    'PublicResolver',
    publicResolverAddress,
  )
  const ReverseRegistrar = await ethers.getContractAt(
    'ReverseRegistrar',
    reverseRegistrarAddress,
  )
  for (const entry of batchData) {
    for (const subdomain of entry.subdomains) {
      const forwardNameDTCC = `${subdomain.name}.${entry.name}.${tld}`
      const subdomainNamehash = utils.namehash(
        `${subdomain.name}.${entry.name}.${tld}`,
      )
      console.log(`Registering ${subdomain.name}.${entry.name}.${tld}`)
      try {
        // await hre.deployments.execute(
        //   'FIFSRegistrarWithExpiration', //root node is eth which is set during deployment
        //   { from: deployer.address }, // deployer is the current owner of the .eth namespace
        //   'doRegistration',
        //   `${subdomain.name}`,
        //   subdomain.address, // now owner is the one who owns the name dtcc.eth
        //   publicResolverAddress,
        //   31536000,
        // )
        await FIFSRegistrarWithExpiration.doRegistration(
          `${subdomain.name}`,
          subdomain.address,
          publicResolverAddress,
          31536000,
        )
        // Post-registration checks
        console.log(
          `\n\nPerforming post-registration checks for ${subdomain.name}.${entry.name}.${tld}`,
        )

        const forwardResolverDTCC = await ENSRegistry.resolver(
          utils.namehash(forwardNameDTCC),
        )
        const forwardRecordDTCC = await hre.deployments.read(
          'PublicResolver',
          {},
          'addr(bytes32)',
          utils.namehash(forwardNameDTCC),
        )

        // Forward resolver check
        console.log('')
        console.log('Forward Name:', forwardNameDTCC)
        console.log('Forward Resolver:', forwardResolverDTCC)
        console.log('Forward Record:', forwardRecordDTCC)

        // Reverse resolver check
        const reverseName = `${forwardRecordDTCC
          .slice(2)
          .toLowerCase()}.addr.reverse`
        let reverseResolver = await ENSRegistry.resolver(
          utils.namehash(reverseName),
        )
        let reverseRecord = await hre.deployments.read(
          'PublicResolver',
          {},
          'name(bytes32)',
          utils.namehash(reverseName),
        )
        console.log(`Reverse Name: ${reverseName}`)
        console.log(`Reverse Resolver: ${reverseResolver}`)
        console.log(`Reverse Record: ${reverseRecord}`)
      } catch (error) {
        console.error(
          `Failed to register ${subdomain.name}.${entry.name}.${tld}:`,
          error,
        )
      }
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
