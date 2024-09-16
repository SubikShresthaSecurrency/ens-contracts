import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { constants, utils } from 'ethers'
const { AddressZero, HashZero } = constants

const tld = 'eth'
// do a test registration
const name = 'dtcc'
const subdomain = 'shyam'

const name2 = 'dtcc2'
const subdomain2 = 'ram'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre
  const { deployer, owner } = await getNamedAccounts()

  // Registry is the main contract that stores all the information about the domain
  // Like subdomainOwner, owner, resolver etc
  console.log('Deploying Registry')

  const ens = await hre.deployments.deploy('ENSRegistry', {
    from: deployer,
    args: [],
  })

  console.log('Deployed Registry at', ens.address)

  // Registrar is the contract that manages the registration of names within a TLD
  console.log('Deploying Registrar')

  // FIRST in FIRST served registrar.
  // Simpler One
  const registrar = await hre.deployments.deploy('FIFSRegistrar', {
    from: deployer,
    args: [ens.address, utils.namehash(tld)],
  })

  console.log('Deployed Registrar at', registrar.address)

  // allow the registrar to create names within the tld namespace
  if (registrar.newlyDeployed) {
    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer }, //owner
      'setSubnodeOwner',
      HashZero,
      utils.id(tld),
      registrar.address,
    )
  }

  // Reverse Registrar is a contract that manages the reverse records for the domain like mapping an address to a name
  console.log('Deploying Reverse Registrar')

  const reverseRegistrar = await hre.deployments.deploy('ReverseRegistrar', {
    from: deployer,
    args: [ens.address],
  })

  // allow the reverse registrar to create names within the reverse.addr namespace
  if (reverseRegistrar.newlyDeployed) {
    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer },
      'setSubnodeOwner',
      HashZero,
      utils.id('reverse'),
      deployer,
    ) //HashZero is the root node and is authorised to be used by deployer

    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer },
      'setSubnodeOwner',
      utils.namehash('reverse'),
      utils.id('addr'),
      reverseRegistrar.address,
    )
  }

  console.log('Deployed Reverse Registrar at', reverseRegistrar.address)

  // Public Resolver is a contract that stores the records for the domain
  const resolver = await hre.deployments.deploy('PublicResolver', {
    from: deployer,
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
      { from: deployer },
      'setDefaultResolver',
      resolver.address,
    )
  }

  console.log('Deployed Resolver at', resolver.address)

  // Register a name to FIFS Registrar - Which makes "owner address" as the owner of the name - dtcc.eth. Since .eth is  a tld and already registered in registrar
  // FIFS is a simple registrar that allows a name to be registered in first in first served basis.
  // There is Base Registrar as well - which is more complicated with a controller and proxy
  // It's deployed in resolve.js file
  await hre.deployments.execute(
    'FIFSRegistrar', //root node is eth which is set during deployment
    { from: deployer }, // deployer is the current owner of the .eth namespace
    'register',
    utils.id(name),
    owner, // now owner is the one who owns the name dtcc.eth
  )

  console.log(`Registered ${name}.${tld} to`, owner)

  // Set the owner of the subdomain - shyam.dtcc.eth to owner. dtcc.eth is concatenated with shyam as keccak
  await hre.deployments.execute(
    'ENSRegistry',
    { from: owner },
    'setSubnodeOwner',
    utils.namehash(`${name}.${tld}`),
    utils.id(subdomain),
    owner,
  )

  console.log('Set subdomain owner for', `${name}.${tld}.${subdomain}`)

  // Set the resolver for the subdomain - shyam.dtcc.eth to resolver
  // resolver is the contract address of PublicResolver
  await hre.deployments.execute(
    'ENSRegistry',
    { from: owner },
    'setResolver',
    utils.namehash(`${subdomain}.${name}.${tld}`),
    resolver.address,
  )
  console.log(`Set resolver for ${name}.${tld} to`, resolver.address)

  // Set the name shym.dtcc.eth to deployer. Ie, forward name is now mapped to deployer.
  await hre.deployments.execute(
    'PublicResolver',
    { from: owner },
    'setAddr(bytes32,address)',
    utils.namehash(`${subdomain}.${name}.${tld}`),
    deployer,
  )
  console.log(`Set reverse record for ${name}.${tld} to`, owner)

  // Set the reverse record for deployer to shyam.dtcc.eth
  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: deployer }, //sets the name of reverse record to the caller
    'setName',
    `${subdomain}.${name}.${tld}`,
  )

  console.log(
    `Set reverse record for ${owner} to`,
    `${subdomain}.${name}.${tld}`,
  )

  //##################################################################################

  // This is the second name registration
  await hre.deployments.execute(
    'FIFSRegistrar',
    { from: deployer },
    'register',
    utils.id(name2),
    owner,
  )
  console.log(`Registered ${name2}.${tld} to`, owner)

  await hre.deployments.execute(
    'ENSRegistry',
    { from: owner },
    'setSubnodeOwner',
    utils.namehash(`${name2}.${tld}`),
    utils.id(subdomain2),
    owner,
  )

  console.log('Set subdomain owner for', `${name2}.${tld}.${subdomain}`)

  await hre.deployments.execute(
    'ENSRegistry',
    { from: owner },
    'setResolver',
    utils.namehash(`${subdomain2}.${name2}.${tld}`),
    resolver.address,
  )
  console.log(`Set resolver for ${name2}.${tld} to`, resolver.address)

  await hre.deployments.execute(
    'PublicResolver',
    { from: owner },
    'setAddr(bytes32,address)',
    utils.namehash(`${subdomain2}.${name2}.${tld}`),
    owner,
  )
  console.log(`Set reverse record for ${name2}.${tld} to`, owner)

  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: owner },
    'setName',
    `${subdomain2}.${name2}.${tld}`,
  )
  console.log(
    `Set reverse record for ${owner} to`,
    `${subdomain2}.${name2}.${tld}`,
  )

  //##################################################################################

  console.log('')
  const forwardName = `${subdomain}.${name}.${tld}`
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

  //##################################################################################

  const forwardName2 = `${subdomain2}.${name2}.${tld}`
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
}

func(hre as HardhatRuntimeEnvironment)
