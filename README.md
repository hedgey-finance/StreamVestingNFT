# Hedgey Linear Unlock (Streaming) and Linear Vesting Token NFT Contracts

The contracts in this repository are for the a vesting and linear unlock protocol to timelock and vest ERC20 tokens.   
The contracts backbone are ERC721 NFTs, that leverage the power of NFTs combined with time locking and vesting mechanisms to bring best in class token management tools for DAO treasuries. 

There are technical documentation in this repository that describe the contracts functions and uses, and technical requirements. For more information please visit [Hedgey Website](https://hedgey.finance)

The contracts have been audited by Hacken, completed on April 7, 2023 with reference to commit hash 59e62e79f5ab2f94c8ecab75f14c7af7d851b9f0. The contracts and files have not changed, only the audit and readme has been uploaded after this commit to include the new audit and deployment details. 

## Testing
Clone repository

``` bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployment
To deploy the contracts, you should first create a `keys.js` file that contains the deployer wallet private keys, along with your rcp URLs, and etherscan API codes. Link those to the hardhat.config.ts file as well as in the `deploy.js` file in the ./scrips folder.  
Then navigate to the `deploy.js` file, create a line of code that uses the deploy(...) function - inputting your rpc, private key, and the contract that you want to deploy. 

After deployment you can use hardhat's etherscan api to verify contracts with 

`npx hardhat verify --network [network_name] [contract_address] [args]`


## Acitve Deployments: 
The primary contracts have been actively deployed, with the same contract address, across the following network: Ethereum Mainnet, ArbitrumOne, Optimism, Polygon, Boba, Avalanche C-chain, Fantom Opera, Gnosis Chain, Binance Smart Chain, Harmony, Celo, Evmos, OkEx Chain (OEC).

StreamVestingNFT: `0x476cF198afaC0fb13576f664cb49e5E658fd4322`  
StreamingHedgeys: `0xd6e5E27F310C61633D331DBa585F7c55F579bbF6`  
StreamingBoundHedgeys: `0x110DD7887321f24477BF4A135a1E5eB7Bf31691a`  

