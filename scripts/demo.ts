import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { constants, utils } from 'ethers'
import { ethers } from 'hardhat'

const { AddressZero, HashZero } = constants

const tld = 'test' //label
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre
  const { deployer, owner } = await getNamedAccounts()

  console.log('Deploying Registry')
  const ens = await ethers.getContract('ENSRegistry')

  console.log('Deployed Registry at', ens.address)

  console.log('Deploying Registrar')
  const registrar = await hre.deployments.deploy('FIFSRegistrar', {
    from: deployer,
    args: [ens.address, utils.namehash(tld)],
  })

  // allow the registrar to create names within the tld namespace
  if (registrar.newlyDeployed) {
    await hre.deployments.execute(
      'ENSRegistry',
      { from: deployer },
      'setSubnodeOwner',
      HashZero,
      utils.id(tld),
      registrar.address,
    )
  }

  console.log('Deployed Registrar at', registrar.address)

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

  // do a test registration
  const name = 'energy'
  if (ens.newlyDeployed) {
    await hre.deployments.execute(
      'FIFSRegistrar',
      { from: deployer },
      'register',
      utils.id(name),
      owner,
    )
    console.log(`Registered ${name}.${tld} to`, owner)

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
  }

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

func.id = 'demo'
func.tags = ['demo', 'vechain-energy']
func.dependencies = []

func(hre)
