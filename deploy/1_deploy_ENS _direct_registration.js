const { constants, utils } = require('ethers')
const { AddressZero, HashZero } = constants
const { ethers } = require('hardhat')

// eth
// dda
// zach.dtcc.eth
const tld = 'dda' //dda
const name = 'dtcc' // dtcc
const subdomainZach = 'zach'
const subdomainWallet = 'wallet'

module.exports = async function main() {
  const [deployer, owner, DTCCWallet, ZACHWallet] = await ethers.getSigners()

  // Registry is the main contract that stores all the information about the domain
  // Like subdomainOwner, owner, resolver etc
  console.log('Deploying Registry')

  let tx

  const ens = await hre.ethers.getContractAt(
    'ENSRegistry',
    '0x6A1E3042922E0252befBD385Ee35ce48A9806904',
  )
  const ENSRegistry = await ethers.getContractAt('ENSRegistry', ens.address)
  // const ens = await hre.deployments.deploy('ENSRegistry', {
  //   from: deployer.address,
  //   args: [],
  // })

  const duration = 86400 * 365

  console.log('Deployed Registry at', ens.address)

  // Registrar is the contract that manages the registration of names within a TLD
  console.log('Deploying Registrar')

  // FIRST in FIRST served registrar.
  // Simpler One
  const registrar = await hre.deployments.deploy(
    'FIFSRegistrarWithExpiration',
    {
      from: deployer.address,
      args: [ens.address, utils.namehash(tld), utils.id(name)],
    },
  )

  console.log('Deployed Registrar at', registrar.address)

  // allow the registrar to create names within the tld namespace
  // if (registrar.newlyDeployed) {
  //   tx = await ENSRegistry.setSubnodeOwner(
  //     HashZero,
  //     utils.id(tld),
  //     deployer.address, // deployer is now the owner
  //   )
  //   console.log(1)

  //   await tx.wait()
  // }

  tx = await ENSRegistry.setSubnodeOwner(
    utils.namehash(tld),
    utils.id(name),
    registrar.address, // set the owner of the subdomain to registrar
  )
  await tx.wait()

  console.log(2)

  // Reverse Registrar is a contract that manages the reverse records for the domain like mapping an address to a name
  console.log('Deploying Reverse Registrar')

  const reverseRegistrar = await hre.deployments.deploy('ReverseRegistrar', {
    from: deployer.address,
    args: [ens.address],
  })

  // allow the reverse registrar to create names within the reverse.addr namespace
  // we set deployer address as the owner -
  // because we still need to do further configuration for reverse address
  if (reverseRegistrar.newlyDeployed) {
    tx = await ENSRegistry.setSubnodeOwner(
      HashZero,
      utils.id('reverse'),
      deployer.address,
    )

    await tx.wait()

    tx = await ENSRegistry.setSubnodeOwner(
      utils.namehash('reverse'),
      utils.id('addr'),
      reverseRegistrar.address,
    )

    await tx.wait()
  }

  // set deployer as controller of the reverse registrar
  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: deployer.address },
    'setController',
    deployer.address,
    true,
  )

  // set deployer as controller of the reverse registrar
  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: deployer.address },
    'setController',
    registrar.address,
    true,
  )

  console.log('Deployed Reverse Registrar at', reverseRegistrar.address)

  console.log('Setting Reverse Registrar in FIFS')

  await hre.deployments.execute(
    'FIFSRegistrarWithExpiration',
    { from: deployer.address },
    'setReverseRegistrar',
    reverseRegistrar.address,
  )

  console.log('Set Reverse Registrar in FIFS')

  // Public Resolver is a contract that stores the records for the domain
  const resolver = await hre.deployments.deploy('PublicResolver', {
    from: deployer.address,
    args: [
      ens.address,
      AddressZero,
      registrar.address,
      reverseRegistrar.address,
    ],
  })

  // set the resolver as the default resolver for the reverse registrar
  if (resolver.newlyDeployed) {
    await hre.deployments.execute(
      'ReverseRegistrar',
      { from: deployer.address },
      'setDefaultResolver',
      resolver.address,
    )
  }

  console.log('Deployed Resolver at', resolver.address)

  //##################################################################################
  //##################################################################################
  //################     DEPLOYMENT ENDS HERE           ##############################
  //##################################################################################
  //##################################################################################

  //###################################################################################
  //###################################################################################
  //###############   FIRST DOMAIN REGISTRATION START    ##############################
  //###################################################################################
  //###################################################################################

  // Register a name to FIFS Registrar - Which makes "deployer", the owner of the name - dtcc.eth.
  // FIFS is a simple registrar that allows a name to be registered in first in first served basis.
  // Why does register work even though deployer.address is not the owner? Because - it is brand new domain name
  await hre.deployments.execute(
    'FIFSRegistrarWithExpiration', //root node is eth which is set during deployment
    { from: deployer.address }, // deployer is the current owner of the .eth namespace
    'doRegistration',
    subdomainWallet,
    '0xc110B453fd254ec8E37BD79ae62026BC059c7FB2', // now owner is the one who owns the name dtcc.eth
    resolver.address,
    duration,
  )

  const forwardNameDTCC = `${subdomainWallet}.${name}.${tld}`

  const forwardResolverDTCC = await ENSRegistry.resolver(
    utils.namehash(forwardNameDTCC),
  )

  const forwardRecordDTCC = await hre.deployments.read(
    'PublicResolver',
    {},
    'addr(bytes32)',
    utils.namehash(forwardNameDTCC),
  )

  console.log('')
  console.log('Forward Name:', forwardNameDTCC)
  console.log('Forward Resolver:', forwardResolverDTCC)
  console.log('Forward Record:', forwardRecordDTCC)

  let reverseName = `${forwardRecordDTCC.slice(2).toLowerCase()}.addr.reverse`

  let reverseResolver = await ENSRegistry.resolver(utils.namehash(reverseName))

  let reverseRecord = await hre.deployments.read(
    'PublicResolver',
    {},
    'name(bytes32)',
    utils.namehash(reverseName),
  )

  console.log('')
  console.log('Reverse Name:', reverseName)
  console.log('Reverse Resolver:', reverseResolver)
  console.log('Reverse Record:', reverseRecord)

  // Register a name to FIFS Registrar - Which makes "deployer", the owner of the name - dtcc.eth.
  // FIFS is a simple registrar that allows a name to be registered in first in first served basis.
  // Why does register work even though deployer.address is not the owner? Because - it is brand new domain name
  await hre.deployments.execute(
    'FIFSRegistrarWithExpiration', //root node is eth which is set during deployment
    { from: deployer.address }, // deployer is the current owner of the .eth namespace
    'doRegistration',
    subdomainZach,
    '0x6A1E3042922E0252befBD385Ee35ce48A9806904', // now owner is the one who owns the name dtcc.eth
    resolver.address,
    duration,
  )

  console.log('here?')

  const forwardNameZach = `${subdomainZach}.${name}.${tld}`

  const forwardResolverZach = await ENSRegistry.resolver(
    utils.namehash(forwardNameZach),
  )

  const forwardRecordZach = await hre.deployments.read(
    'PublicResolver',
    {},
    'addr(bytes32)',
    utils.namehash(forwardNameZach),
  )

  console.log('')
  console.log('Forward Name:', forwardNameZach)
  console.log('Forward Resolver:', forwardResolverZach)
  console.log('Forward Record:', forwardRecordZach)

  reverseName = `${forwardRecordZach.slice(2).toLowerCase()}.addr.reverse`

  reverseResolver = await ENSRegistry.resolver(utils.namehash(reverseName))

  reverseRecord = await hre.deployments.read(
    'PublicResolver',
    {},
    'name(bytes32)',
    utils.namehash(reverseName),
  )

  console.log('')
  console.log('Reverse Name:', reverseName)
  console.log('Reverse Resolver:', reverseResolver)
  console.log('Reverse Record:', reverseRecord)
}
