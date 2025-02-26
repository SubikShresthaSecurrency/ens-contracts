const { constants, utils } = require('ethers')
const { ethers } = require('hardhat')

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
const ensRegistryAddress = '0xce75A95160D96F5388437993aB5825F322426E04' // dummy address - change to real address
const registrarAddress = '0x0e52147E1aD0d48F76074214e0782EE4A6Dca120' // dummy address - change to real address
const reverseRegistrarAddress = '0x8aEE29EaA4CE75FA53A7F63EEDA722aADaa21DC9' // dummy address - change to real address
const publicResolverAddress = '0xde6Ef25c30e990415a9C0F67f1cCdc2080Ee8045' // dummy address - change to real address

const batchData = [
  {
    name: 'dtcc',
    subdomains: [
      { name: 'zach56', address: '0x8aEE29EaA4CE75FA53A7F63EEDA722aADaa21DC9' },
      {
        name: 'wallet56',
        address: '0xde6Ef25c30e990415a9C0F67f1cCdc2080Ee8045',
      },
    ],
  },
  // Add more entries as needed
]

async function main() {
  const [deployer] = await ethers.getSigners()

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
    'ReverseRegistrar',
    reverseRegistrarAddress,
  )

  for (const entry of batchData) {
    const namehash = utils.namehash(`${entry.name}.${tld}`)
    try {
      // Register the main domain
      console.log(`Registering ${entry.name}.${tld}`)
      // Add your registration logic here

      // Set resolver for the main domain
      await ENSRegistry.setResolver(namehash, publicResolverAddress)
      console.log(`Set resolver for ${entry.name}.${tld}`)

      for (const subdomain of entry.subdomains) {
        const subdomainNamehash = utils.namehash(
          `${subdomain.name}.${entry.name}.${tld}`,
        )
        console.log(`Setting subdomain ${subdomain.name}.${entry.name}.${tld}`)

        // Set subdomain owner
        await ENSRegistry.setSubnodeOwner(
          namehash,
          utils.keccak256(utils.toUtf8Bytes(subdomain.name)),
          deployer.address,
        )
        console.log(
          `Set subdomain owner for ${subdomain.name}.${entry.name}.${tld}`,
        )

        // Set resolver for subdomain
        await ENSRegistry.setResolver(subdomainNamehash, publicResolverAddress)
        console.log(`Set resolver for ${subdomain.name}.${entry.name}.${tld}`)

        // Set forward record
        await PublicResolver['setAddr(bytes32,address)'](
          subdomainNamehash,
          subdomain.address,
        )
        console.log(
          `Set forward record for ${subdomain.name}.${entry.name}.${tld} to ${subdomain.address}`,
        )

        await ReverseRegistrar.connect(deployer).setNameForAddr(
          subdomain.address,
          subdomain.address,
          publicResolverAddress,
          `${subdomain.name}.${entry.name}.${tld}`,
        )

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
        console.log('Forward Name:', forwardName)
        console.log('Forward Resolver:', forwardResolver)
        console.log('Forward Record:', forwardRecord)

        const reverseName = `${forwardRecord
          .slice(2)
          .toLowerCase()}.addr.reverse`

        const reverseResolver = await ENSRegistry.resolver(
          utils.namehash(reverseName),
        )
        const reverseRecord = await PublicResolver['name(bytes32)'](
          utils.namehash(reverseName),
        )
        console.log('Reverse Name:', reverseName)
        console.log('Reverse Resolver:', reverseResolver)
        console.log('Reverse Record:', reverseRecord)

        const publicReverseResolver = await ethers.getContractAt(
          'PublicResolver',
          reverseResolver,
        )
        const domainName = await publicReverseResolver.name(
          utils.namehash(reverseName),
        )
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
