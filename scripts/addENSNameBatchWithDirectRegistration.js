const { constants } = require('buffer')
const { ethers } = require('hardhat')
const utils = ethers.utils

const tld = 'dda'

const ensRegistryAddress = '0xce75A95160D96F5388437993aB5825F322426E04' // dummy address - change to real address
const registrarAddress = '0x0e52147E1aD0d48F76074214e0782EE4A6Dca120' // dummy address - change to real address
const reverseRegistrarAddress = '0xb9AdA6B44E4CFF8FE00443Fadf8ad006CfCc2d10' // dummy address - change to real address
const publicResolverAddress = '0x79dFFC4DcBb1f598EC3741E939f22bAAF56448Da' // dummy address - change to real address

const batchData = [
  {
    name: 'dtcc',
    subdomains: [
      {
        name: 'zach562',
        address: '0xce75A95160D96F5388437993aB5825F322426E04',
      },
      {
        name: 'wallet562',
        address: '0x0e52147E1aD0d48F76074214e0782EE4A6Dca120',
      },
    ],
  },
  // Add more entries as needed
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
      const subdomainNamehash = utils.namehash(
        `${subdomain.name}.${entry.name}.${tld}`,
      )
      console.log(`Registering ${subdomain.name}.${entry.name}.${tld}`)
      try {
        await FIFSRegistrarWithExpiration.doRegistration(
          `${subdomain.name}`,
          subdomain.address,
          publicResolverAddress,
          31536000,
        )

        // Set reverse record
        const reverseName = `${subdomain.address
          .slice(2)
          .toLowerCase()}.addr.reverse`
        const reverseNamehash = utils.namehash(reverseName)
        console.log(`Set reverse record for ${subdomain.address}`)
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
