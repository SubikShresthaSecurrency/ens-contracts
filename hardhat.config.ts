import { exec as _exec } from 'child_process'

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-solhint'
import '@nomiclabs/hardhat-truffle5'
import '@nomiclabs/hardhat-waffle'
import dotenv from 'dotenv'
import 'hardhat-abi-exporter'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import 'hardhat-gas-reporter'
import { HardhatUserConfig } from 'hardhat/config'
import { promisify } from 'util'

const exec = promisify(_exec)

// hardhat actions
import './tasks/accounts'
import './tasks/archive_scan'
import './tasks/save'
import './tasks/seed'

// Load environment variables from .env file. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.
// https://github.com/motdotla/dotenv
dotenv.config({ debug: false })

let real_accounts = undefined
if (process.env.DEPLOYER_KEY) {
  real_accounts = [
    process.env.DEPLOYER_KEY,
    process.env.OWNER_KEY || process.env.DEPLOYER_KEY,
  ]
}

// circular dependency shared with actions
export const archivedDeploymentPath = './deployments/archive'

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      saveDeployments: false,
      tags: ['test', 'legacy', 'use_root'],
      allowUnlimitedContractSize: false,
    },
    besu: {
      url: process.env.BESU_RPC_URL || '',
      chainId: 1337,
      accounts: process.env.BESU_PRIVATE_KEY_1
        ? [
            process.env.BESU_PRIVATE_KEY_1
              ? process.env.BESU_PRIVATE_KEY_1
              : '',
            process.env.BESU_PRIVATE_KEY_2
              ? process.env.BESU_PRIVATE_KEY_2
              : '',
            process.env.BESU_PRIVATE_KEY_3
              ? process.env.BESU_PRIVATE_KEY_3
              : '',
            process.env.BESU_PRIVATE_KEY_4
              ? process.env.BESU_PRIVATE_KEY_4
              : '',
            process.env.BESU_PRIVATE_KEY_5
              ? process.env.BESU_PRIVATE_KEY_5
              : '',
            process.env.BESU_PRIVATE_KEY_6
              ? process.env.BESU_PRIVATE_KEY_6
              : '',
            process.env.BESU_PRIVATE_KEY_7
              ? process.env.BESU_PRIVATE_KEY_7
              : '',
            process.env.BESU_PRIVATE_KEY_8
              ? process.env.BESU_PRIVATE_KEY_8
              : '',
            process.env.BESU_PRIVATE_KEY_9
              ? process.env.BESU_PRIVATE_KEY_9
              : '',
            process.env.BESU_PRIVATE_KEY_10
              ? process.env.BESU_PRIVATE_KEY_10
              : '',
            process.env.BESU_PRIVATE_KEY_11
              ? process.env.BESU_PRIVATE_KEY_11
              : '',
            process.env.BESU_PRIVATE_KEY_12
              ? process.env.BESU_PRIVATE_KEY_12
              : '',
            process.env.BESU_PRIVATE_KEY_13
              ? process.env.BESU_PRIVATE_KEY_13
              : '',
            process.env.BESU_PRIVATE_KEY_14
              ? process.env.BESU_PRIVATE_KEY_14
              : '',
            process.env.BESU_PRIVATE_KEY_15
              ? process.env.BESU_PRIVATE_KEY_15
              : '',
            process.env.BESU_PRIVATE_KEY_16
              ? process.env.BESU_PRIVATE_KEY_16
              : '',
            process.env.BESU_PRIVATE_KEY_17
              ? process.env.BESU_PRIVATE_KEY_17
              : '',
            process.env.BESU_PRIVATE_KEY_18
              ? process.env.BESU_PRIVATE_KEY_18
              : '',
            process.env.BESU_PRIVATE_KEY_19
              ? process.env.BESU_PRIVATE_KEY_19
              : '',
            process.env.BESU_PRIVATE_KEY_20
              ? process.env.BESU_PRIVATE_KEY_20
              : '',
            process.env.BESU_PRIVATE_KEY_21
              ? process.env.BESU_PRIVATE_KEY_21
              : '',
            process.env.BESU_PRIVATE_KEY_22
              ? process.env.BESU_PRIVATE_KEY_22
              : '',
            process.env.BESU_PRIVATE_KEY_23
              ? process.env.BESU_PRIVATE_KEY_23
              : '',
          ]
        : [],
    },
  },
  mocha: {},
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1200,
          },
        },
      },
      // for DummyOldResolver contract
      {
        version: '0.4.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  abiExporter: {
    path: './build/contracts',
    runOnCompile: true,
    clear: true,
    flat: true,
    except: [
      'Controllable$',
      'INameWrapper$',
      'SHA1$',
      'Ownable$',
      'NameResolver$',
      'TestBytesUtils$',
      'legacy/*',
    ],
    spacing: 2,
    pretty: true,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    owner: {
      default: 1,
    },
    DTCCWallet: {
      default: 2,
    },
    ZACHWallet: {
      default: 3,
    },
  },
  external: {
    contracts: [
      {
        artifacts: [archivedDeploymentPath],
      },
    ],
  },
}

export default config
