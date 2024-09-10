import { ethers } from 'hardhat'
import { constants, utils } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const tld = 'test' //label
const name = 'subik'
async function main(hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre
  const { deployer, owner } = await getNamedAccounts()

  const ensRegistry = await ethers.getContract('ENSRegistry')
  const publicResolver = await ethers.getContract('PublicResolver')

  await ensRegistry.setResolver(
    utils.namehash(`${name}.${tld}`),
    publicResolver.address,
  )
  await hre.deployments.execute(
    'ENSRegistry',
    { from: owner },
    'setResolver',
    utils.namehash(`${name}.${tld}`),
    resolver.address,
  )
}
