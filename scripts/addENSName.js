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
// do a test registration
const name = 'dtcc'
const subdomain = 'world'

const ensRegistryAddress = '0x6A1E3042922E0252befBD385Ee35ce48A9806904' //dummy address - change to real address
const registrarAddress = '0x79EAFe3655C0E94b0CE180E76a4bBa4B3ED24555' //dummy address - change to real address
const reverseRegistrarAddress = '0x6D33498AF82D2D667e2626fCbbf56685161c2F5a' //dummy address - change to real address
const publicResolverAddress = '0x1a9522C0C88060cDb59AABA2c52648f19aCc7329' //dummy address - change to real address
const walletAddress = '0xc5388c6db23468b8037b790aa778e2088150794b'

// const ensRegistryAddress = '0xce75A95160D96F5388437993aB5825F322426E04' //dummy address - change to real address
// const registrarAddress = '0x0e52147E1aD0d48F76074214e0782EE4A6Dca120' //dummy address - change to real address
// const reverseRegistrarAddress = '0x8aEE29EaA4CE75FA53A7F63EEDA722aADaa21DC9' //dummy address - change to real address
// const publicResolverAddress = '0xde6Ef25c30e990415a9C0F67f1cCdc2080Ee8045' //dummy address - change to real address
// const walletAddress = "0x4c5f0f90a2d4b518afba11e22ac9b8f6b031d204"

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
    walletAddress,
    { gasLimit: 1000000 },
  )

  await tx.wait()

  console.log(`Set address for ${subdomain}.${name}.${tld} to`, walletAddress)

  tx = await ReverseRegistrar.connect(deployer).setNameForAddr(
    walletAddress,
    walletAddress,
    publicResolverAddress,
    `${subdomain}.${name}.${tld}`,
  )
  await tx.wait()
  console.log(
    `Set reverse record for ${walletAddress} to`,
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
