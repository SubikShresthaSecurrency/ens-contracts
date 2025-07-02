const { constants, utils } = require('ethers')
const { AddressZero, HashZero } = constants
const { ethers } = require('hardhat')

// zach.dtcc.eth
const tld = 'eth'
const name = 'dtcc'
const subdomainZach = 'test'
const dtccWalletSubdomain = 'testdemo'

const DTCCWalletAddress = '0xF71d93B72b7cA6C12d9deb0a0Ace7aF31Ae889F3'
const ZACHWalletAddress = '0x7Bc15d8FA3B1F1c7f8FbA79ECA295bF35b8805ed'

module.exports = async function main() {
  const [deployer, owner] = await ethers.getSigners()

  // Registry is the main contract that stores all the information about the domain
  // Like subdomainOwner, owner, resolver etc
  console.log('Deploying Registry')

  let tx

  const ens = await hre.deployments.deploy('ENSRegistry', {
    from: deployer.address,
    args: [],
  })

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
      args: [ens.address, utils.namehash(tld)],
    },
  )

  console.log('Deployed Registrar at', registrar.address)

  // allow the registrar to create names within the tld namespace
  if (registrar.newlyDeployed) {
    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer.address }, //owner
      'setSubnodeOwner',
      HashZero, // Zero Hash makes root owner the registrar
      utils.id(tld), // tld aka .eth is passed
      registrar.address, // registrar is now the owner
    )
  }

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
    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer.address },
      'setSubnodeOwner',
      HashZero,
      utils.id('reverse'),
      deployer.address, //HashZero is the root node and is authorised to be used by deployer
    )

    // we do the configuration and set the reverse registrar as the owner
    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer.address },
      'setSubnodeOwner',
      utils.namehash('reverse'),
      utils.id('addr'),
      reverseRegistrar.address,
    )
  }

  // set deployer as controller of the reverse registrar
  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: deployer.address },
    'setController',
    deployer.address,
    true,
  )

  console.log('Deployed Reverse Registrar at', reverseRegistrar.address)

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
    'register',
    utils.id(name),
    deployer.address, // now owner is the one who owns the name dtcc.eth
    duration,
  )

  console.log(`Registered ${name}.${tld} to`, deployer.address)

  //Set the owner of the subdomain - zach.dtcc.eth to owner. dtcc.eth is concatenated with zach as keccak
  await hre.deployments.execute(
    'ENSRegistry',
    { from: deployer.address },
    'setSubnodeOwner',
    utils.namehash(`${name}.${tld}`),
    utils.id(subdomainZach),
    deployer.address, // ZACHWallet is the owner. Now the wallet can setApprovalForAll for the domain. If it wants to transfer ownership it needs to call setSubnodeOwner again
  )

  await hre.deployments.execute(
    'FIFSRegistrarWithExpiration', //root node is eth which is set during deployment
    { from: deployer.address }, // deployer is the current owner of the .eth namespace
    'register',
    utils.namehash(`${subdomainZach}.${name}`),
    deployer.address, // now owner is the one who owns the name dtcc.eth
    duration,
  )

  const available = await hre.deployments.read(
    'FIFSRegistrarWithExpiration',
    { from: deployer.address },
    'available(bytes32)',
    utils.namehash(`${subdomainZach}.${name}`),
  )

  console.log('Set subdomainZach owner for', `${subdomainZach}.${name}.${tld}`)

  // Set the resolver for the subdomainZach - zach.dtcc.eth to resolver
  // resolver is the contract address of PublicResolver
  await hre.deployments.execute(
    'ENSRegistry',
    { from: deployer.address },
    'setResolver',
    utils.namehash(`${subdomainZach}.${name}.${tld}`),
    resolver.address,
  )

  console.log(
    `Set resolver for ${subdomainZach}.${name}.${tld} to`,
    resolver.address,
  )

  // Set the name shym.dtcc.eth to deployer. Ie, forward name is now mapped to deployer.
  await hre.deployments.execute(
    'PublicResolver',
    { from: deployer.address },
    'setAddr(bytes32,address)',
    utils.namehash(`${subdomainZach}.${name}.${tld}`),
    ZACHWalletAddress, // this will map the name to the address
  )

  console.log(
    `Set forward record for ${subdomainZach}.${name}.${tld} to`,
    ZACHWalletAddress,
  )

  // Set the reverse record for deployer to zach.dtcc.eth
  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: deployer.address, gasLimit: 5000000 }, // sets the name of reverse record to the caller with manual gas limit
    'setNameForAddr(address,address,address,string)',
    ZACHWalletAddress,
    ZACHWalletAddress,
    resolver.address,
    `${subdomainZach}.${name}.${tld}`,
  )

  console.log(
    `Set reverse record for ${ZACHWalletAddress} to ${subdomainZach}.${name}.${tld}`,
  )

  //###################################################################################
  //###################################################################################
  //###############   SECOND DOMAIN REGISTRATION START    #############################
  //###################################################################################
  //###################################################################################

  await hre.deployments.execute(
    'ENSRegistry',
    { from: deployer.address },
    'setSubnodeOwner',
    utils.namehash(`${name}.${tld}`),
    utils.id(dtccWalletSubdomain),
    deployer.address,
  )

  console.log(
    'Set subdomain owner for',
    `${dtccWalletSubdomain}.${name}.${tld}`,
  )

  await hre.deployments.execute(
    'ENSRegistry',
    { from: deployer.address },
    'setResolver',
    utils.namehash(`${dtccWalletSubdomain}.${name}.${tld}`),
    resolver.address,
  )

  console.log(
    `Set resolver for ${dtccWalletSubdomain}.${name}.${tld} to`,
    resolver.address,
  )

  await hre.deployments.execute(
    'PublicResolver',
    { from: deployer.address },
    'setAddr(bytes32,address)',
    utils.namehash(`${dtccWalletSubdomain}.${name}.${tld}`),
    DTCCWalletAddress, // this will map the name to the address
  )

  console.log(
    `Set forward record for ${dtccWalletSubdomain}.${name}.${tld} to`,
    DTCCWalletAddress,
  )

  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: deployer.address },
    'setName(string)',
    `${dtccWalletSubdomain}.${name}.${tld}`,
  )

  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: deployer.address, gasLimit: 5000000 }, // sets the name of reverse record to the caller with manual gas limit
    'setNameForAddr(address,address,address,string)',
    DTCCWalletAddress,
    DTCCWalletAddress,
    resolver.address,
    `${dtccWalletSubdomain}.${name}.${tld}`,
  )

  console.log(
    `Set reverse record for ${DTCCWalletAddress} to ${dtccWalletSubdomain}.${name}.${tld}`,
  )

  //###################################################################################
  //###################################################################################
  //###############        CONSOLE LOGS DETAILS            ############################
  //###################################################################################
  //###################################################################################

  console.log('')
  const forwardName = `${subdomainZach}.${name}.${tld}`
  const forwardResolver = await hre.deployments.read(
    'ENSRegistry',
    'resolver',
    utils.namehash(forwardName),
  )
  const forwardRecord = await hre.deployments.read(
    'PublicResolver',
    {},
    'addr(bytes32)',
    utils.namehash(forwardName),
  )
  console.log('Forward Name:', forwardName)
  console.log('Forward Resolver:', forwardResolver)
  console.log('Forward Record:', forwardRecord)

  const reverseName = `${forwardRecord.slice(2).toLowerCase()}.addr.reverse`

  const reverseResolver = await hre.deployments.read(
    'ENSRegistry',
    'resolver',
    utils.namehash(reverseName),
  )

  const reverseRecord = await hre.deployments.read(
    'PublicResolver',
    {},
    'name(bytes32)',
    utils.namehash(reverseName),
  )

  console.log('')
  console.log('Reverse Name:', reverseName)
  console.log('Reverse Resolver:', reverseResolver)
  console.log('Reverse Record:', reverseRecord)

  //################################
  //## SECOND DOMAIN CONSOLE LOGS ##
  //################################

  const forwardName2 = `${dtccWalletSubdomain}.${name}.${tld}`
  const forwardResolver2 = await hre.deployments.read(
    'ENSRegistry',
    'resolver',
    utils.namehash(forwardName2),
  )
  const forwardRecord2 = await hre.deployments.read(
    'PublicResolver',
    {},
    'addr(bytes32)',
    utils.namehash(forwardName2),
  )

  console.log('')
  console.log('Forward Name:', forwardName2)
  console.log('Forward Resolver:', forwardResolver2)
  console.log('Forward Record:', forwardRecord2)

  const reverseName2 = `${forwardRecord2.slice(2).toLowerCase()}.addr.reverse`
  const reverseResolver2 = await hre.deployments.read(
    'ENSRegistry',
    'resolver',
    utils.namehash(reverseName2),
  )
  const reverseRecord2 = await hre.deployments.read(
    'PublicResolver',
    {},
    'name(bytes32)',
    utils.namehash(reverseName2),
  )
  console.log('')
  console.log('Reverse Name:', reverseName2)
  console.log('Reverse Resolver:', reverseResolver2)
  console.log('Reverse Record:', reverseRecord2)

  const publicReverseResolver = await ethers.getContractAt(
    'PublicResolver',
    reverseResolver,
  )
  const domainName1 = await publicReverseResolver.name(
    utils.namehash(reverseName),
  )
  const domainName2 = await publicReverseResolver.name(
    utils.namehash(reverseName2),
  )

  console.log('')
  console.log('First Domain Name Registered Is: ', domainName1)
  console.log('Second Domain Name Registered Is: ', domainName2)
}
