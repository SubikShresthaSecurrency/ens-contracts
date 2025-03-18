const ENS = artifacts.require('./registry/ENSRegistry.sol')
const FIFSRegistrarWithExpiration = artifacts.require(
  './ethregistrar/FIFSRegistrarWithExpiration.sol',
)
const PublicResolver = artifacts.require('./PublicResolver.sol')
const ReverseRegistrar = artifacts.require(
  './reverseRegistrar/ReverseRegistrar.sol',
)

const { exceptions } = require('../test-utils')
const sha3 = require('web3-utils').sha3
const namehash = require('eth-ens-namehash')

contract('FIFSRegistrarWithExpiration', function (accounts) {
  let ens, registrar, resolver, reverseRegistrar
  const tld = 'dda'
  const name = 'dtcc'
  const duration = 31536000 // 1 year in seconds
  const batchData = [
    {
      name: 'dtcc',
      subdomains: [
        {
          name: 'margincoreny',
          address: '0x14D6F2201FC8c8cfd65Dd349dD53d165198C22f7',
        },
        {
          name: 'margincoretokyo',
          address: '0x803B307bbEcB8D8E55959C0F21cD6a5E008D58Ef',
        },
      ],
    },
  ]

  beforeEach(async () => {
    // Deploy ENSRegistry
    ens = await ENS.new()

    // Deploy FIFSRegistrarWithExpiration
    registrar = await FIFSRegistrarWithExpiration.new(
      ens.address,
      namehash.hash(tld),
      sha3(name),
    )

    // Deploy PublicResolver
    resolver = await PublicResolver.new(
      ens.address,
      '0x0000000000000000000000000000000000000000', // No controller
      registrar.address,
      '0x0000000000000000000000000000000000000000', // No reverse registrar
    )

    // Deploy ReverseRegistrar
    reverseRegistrar = await ReverseRegistrar.new(ens.address)

    // Set up ENS hierarchy
    await ens.setSubnodeOwner('0x0', sha3(tld), accounts[0]) // Set deployer as owner of TLD
    await ens.setSubnodeOwner(namehash.hash(tld), sha3(name), registrar.address) // Set registrar as owner of the domain
  })

  it('should register subdomains and verify forward and reverse records', async () => {
    for (const entry of batchData) {
      for (const subdomain of entry.subdomains) {
        const forwardName = `${subdomain.name}.${entry.name}.${tld}`
        const subdomainNamehash = namehash.hash(forwardName)

        // Call doRegistration
        await registrar.doRegistration(
          subdomain.name,
          subdomain.address,
          resolver.address,
          duration,
          { from: accounts[0] },
        )

        // Verify forward resolver
        const forwardResolver = await ens.resolver(subdomainNamehash)
        assert.equal(
          forwardResolver,
          resolver.address,
          'Forward resolver mismatch',
        )

        const forwardRecord = await resolver.addr(subdomainNamehash)
        assert.equal(
          forwardRecord,
          subdomain.address,
          'Forward record mismatch',
        )

        // Set reverse record
        await reverseRegistrar.setName(forwardName, { from: subdomain.address })

        // Verify reverse resolver
        const reverseName = `${subdomain.address
          .slice(2)
          .toLowerCase()}.addr.reverse`
        const reverseNamehash = namehash.hash(reverseName)

        const reverseResolver = await ens.resolver(reverseNamehash)
        assert.equal(
          reverseResolver,
          resolver.address,
          'Reverse resolver mismatch',
        )

        const reverseRecord = await resolver.name(reverseNamehash)
        assert.equal(reverseRecord, forwardName, 'Reverse record mismatch')
      }
    }
  })
})
