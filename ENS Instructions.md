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

- The Registry Maps Domain name to Correct Resolver​
- It stores important information – owner address of the domain, time to live for domain name, resolver address that maps domains to addresses​
- Owners can set Resolver address and time to live and can transfer their ownership of domains​

### Registrar:

- Each Registrar represents a Top-Level Domain (eg. ETH)​
- If you want to setup a domain, then you have to interact with a Registrar​
- We need to deploy separate registrar for each new TLD​

### Resolver:

- User queries the registries and then it gets the address of a resolver. User then uses the resolver to get back the result of the query​
- Public resolver is general purpose resolver​
  ​
