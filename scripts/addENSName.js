const { constants, utils } = require('ethers')
const { ethers } = require('hardhat')

const tld = 'eth'
// do a test registration
const name = 'dtcc'
const subdomain = 'sss'

const ensRegistryAddress = '0xce75A95160D96F5388437993aB5825F322426E04'
const registrarAddress = '0x0e52147E1aD0d48F76074214e0782EE4A6Dca120'

const reverseRegistrarAddress = '0x8aEE29EaA4CE75FA53A7F63EEDA722aADaa21DC9'
const publicResolverAddress = '0xde6Ef25c30e990415a9C0F67f1cCdc2080Ee8045'

async function main() {
  const [deployer] = await ethers.getSigners()
  const duration = 365 * 86400 // 365 days

  // Get the ENSRegistry contract
  const ENSRegistry = await ethers.getContractAt(
    'ENSRegistry',
    ensRegistryAddress,
  )
  const FIFSRegistrar = await ethers.getContractAt(
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

  // Register a name to FIFS Registrar - Which makes "owner address" as the owner of the name - dtcc.eth. Since .eth is  a tld and already registered in registrar
  // FIFS is a simple registrar that allows a name to be registered in first in first served basis.
  // There is Base Registrar as well - which is more complicated with a controller and proxy
  // It's deployed in resolve.js file

  // let tx = await FIFSRegistrar.connect(deployer).register(utils.id(name), deployer.address, duration, {gasLimit: 1000000});
  // await tx.wait()
  let tx

  console.log(`Registered ${name}.${tld} to`, deployer.address)

  // Set the owner of the subdomain - shyam.dtcc.eth to owner. dtcc.eth is concatenated with shyam as keccak
  tx = await ENSRegistry.connect(deployer).setSubnodeOwner(
    utils.namehash(`${name}.${tld}`),
    utils.id(subdomain),
    deployer.address,
    { gasLimit: 1000000 },
  )

  await tx.wait()

  console.log('Set subdomain owner for', `${name}.${tld}.${subdomain}`)

  // Set the resolver for the subdomain - shyam.dtcc.eth to resolver
  // resolver is the contract address of PublicResolver

  tx = await ENSRegistry.connect(deployer).setResolver(
    utils.namehash(`${subdomain}.${name}.${tld}`),
    publicResolverAddress,
    { gasLimit: 1000000 },
  )
  await tx.wait()

  console.log(`Set resolver for ${name}.${tld} to`, publicResolverAddress)

  await PublicResolver['setAddr(bytes32,address)'](
    utils.namehash(`${subdomain}.${name}.${tld}`),
    deployer.address,
    { gasLimit: 1000000 },
  )

  await tx.wait()

  console.log(
    `Set address for ${subdomain}.${name}.${tld} to`,
    deployer.address,
  )

  tx = await ReverseRegistrar.connect(deployer).setName(
    `${subdomain}.${name}.${tld}`,
  )
  await tx.wait()
  console.log(
    `Set reverse record for ${deployer.address} to`,
    `${subdomain}.${name}.${tld}`,
  )

  // Read and log forward and reverse records
  const forwardName = `${subdomain}.${name}.${tld}`
  const forwardResolver = await ENSRegistry.resolver(
    utils.namehash(forwardName),
  )
  const forwardRecord = await PublicResolver['addr(bytes32)'](
    utils.namehash(forwardName),
  )
  console.log('Forward Name:', forwardName)
  console.log('Forward Resolver:', forwardResolver)
  console.log('Forward Record:', forwardRecord)

  const reverseName = `${forwardRecord.slice(2).toLowerCase()}.addr.reverse`
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
