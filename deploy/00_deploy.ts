import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { constants, utils } from 'ethers'
const { AddressZero, HashZero } = constants

const tld = 'test'
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre
  const { deployer, owner } = await getNamedAccounts()

  console.log('Deploying Registry')
  const ens = await hre.deployments.deploy('ENSRegistry', {
    from: deployer,
    args: [],
  })
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
}

export default func
