const { constants, utils } = require('ethers')

const { ethers } = require('hardhat')
const { getNamedAccounts } = require('hardhat')
const tld = 'test'
const name = 'subik'
const sha3 = require('web3-utils').sha3
const { AddressZero, HashZero } = constants

async function main(hre) {
  const { deployer, owner } = await getNamedAccounts()

  // ENSRegistry is a contract that stores the mappings of names to addresses
  console.log('Deploying Registry')
  const ens = await hre.deployments.deploy('ENSRegistry', {
    from: deployer,
    args: [],
  })
  console.log('Deployed Registry at', ens.address)

  // BaseRegistrarImplementation is a contract that manages the registration of names
  console.log('Deploying Registrar')

  const registrar = await hre.deployments.deploy(
    'BaseRegistrarImplementation',
    {
      from: deployer,
      args: [ens.address, utils.namehash(tld)],
    },
  )

  // allow the registrar to create names within the tld namespace
  if (registrar.newlyDeployed) {
    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer },
      'setSubnodeOwner',
      constants.HashZero,
      utils.id(tld),
      registrar.address,
    )
  }

  // ETHRegistrarAdmin is a contract that manages the ownership of the registrar
  const admin = await hre.deployments.deploy('ETHRegistrarAdmin', {
    from: deployer,
    args: [registrar.address],
  })

  // ReverseRegistrar is a contract that manages the reverse resolution of addresses
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
    )
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

  // PublicResolver is a contract that resolves addresses for names
  console.log('Deploying Resolver')
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

  // Transfer ownership of the registrar to the admin contract
  const registrarOwnableABI = await ethers.getContractAt(
    'Ownable2',
    registrar.address,
  )
  await registrarOwnableABI.transferOwnership(admin.address)

  const registrarAdmin = await ethers.getContractAt(
    'ETHRegistrarAdmin',
    admin.address,
  )
  console.log('Adding controller..')

  // Create a new proxy for the controller
  await registrarAdmin.addController(deployer, { from: deployer })

  console.log('Added controller..')

  // Set controllerProxy as the proxy for deployer which acts as the controller
  const controllerProxy = await ethers.getContractAt(
    'ETHRegistrarControllerProxy',
    await registrarAdmin.getProxyAddress(deployer),
  )

  const ensRegistry = await ethers.getContractAt('ENSRegistry', ens.address)
  // Set the registrar as owner of .eth
  console.log('Setting subnode owner')
  await ensRegistry.setSubnodeOwner(
    constants.HashZero,
    sha3('eth'),
    registrar.address,
  )

  console.log('Setting new name')

  await controllerProxy.register(sha3(`${name}`), owner, 86400, {
    from: deployer,
  })

  console.log('Setting resolver')

  await hre.deployments.execute(
    'ENSRegistry',
    { from: owner },
    'setResolver',
    utils.namehash(`${name}.${tld}`),
    resolver.address,
  )

  console.log(`Set resolver for ${name}.${tld} to`, resolver.address)

  await hre.deployments.execute(
    'PublicResolver',
    { from: owner },
    'setAddr(bytes32,address)',
    utils.namehash(`${name}.${tld}`),
    owner,
  )
  console.log(`Set forward record for ${name}.${tld} to`, owner)

  await hre.deployments.execute(
    'ReverseRegistrar',
    { from: owner },
    'setName',
    `${name}.${tld}`,
  )
  console.log(`Set reverse record for ${owner} to`, `${name}.${tld}`)

  // test output for stored configuration
  console.log('')
  const forwardName = `${name}.${tld}`
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
}

main(hre)
