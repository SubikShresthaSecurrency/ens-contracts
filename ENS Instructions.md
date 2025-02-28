# ENS Instructions to deploy - Local Version

#### We have couple of scripts for running the ENS registering and resolving a name process.

#### Currently the file in scripts/demo.ts is the most complete

To execute scripts/demo.ts :

#### Ganache Local Network

And then,

`npx hardhat run scripts/demo.ts --network localhost`

Please look at the scripts/demo.ts file for more detailed explanation on how the steps are being taken to register names and how reverse registrar are used to resolve an address back to the name

# ENS Explanation

There are three main components in ENS

### Registry:

# Registry does three basic things:

- The Registry Maps Domains to Correct Resolver​
- It stores important information – owner address of the domain, time to live for domain name, resolver address that maps domains to addresses​
- Owners can set Resolver address and time to live and can transfer their ownership of domains​

### Registrar:

- Registrar is the Gateway to register names into registry. For ENS Registry (particular tld eg. eth) only Registrar is allowed to register names.
- We need to deploy separate registrar for each new TLD​

### Resolver:

- User queries the registries and then it gets the address of a resolver. User then uses the resolver to get back the result.
- Public resolver is general purpose resolver

### The flow Of Name Registration

- Currently we are using FIFSRegistrarWithExpiration. We need to register the "name" first and we set owner as deployer. When we call register - it sets the owner of name.tld namespace as deployer
- We set subnode owner for the complete domain - subdomain.name.tld as the deployer address
- We set the public resolver for the domain
- We map the name to the required address
- Finally we set the Reverse Registrar - where we use setNameForAddr which basically says to use deployed resolver and set the reverse name for the wallet address. And then, we basically call ensRegistry inside the Reverse Registrar SC - which sets the Reverse Node for the wallet

### Notes:

- When we set subnode owner - the function setSubnodeOwner - we pass HashZero for the root node setup. Because, setSubnodeOwner does abi.encode(node,label) and if we want to setup tld or the top level domain - we pass HashZero - so that only tld is setup and nothing else. It is important to note the HashZero is only applicable for setting up the tld

- Why do we set subnode owner for 'reverse' domain to deployer.address? This is so that the deployer can set reverse registrar as the owner for addr.reverse
  ​
