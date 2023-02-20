# Hedgey Linear Unlock (Streaming) and Linear Vesting Token NFT Contracts

The contracts in this repository are for the a vesting and linear unlock protocol to timelock and vest ERC20 tokens.   
The contracts backbone are ERC721 NFTs, that leverage the power of NFTs combined with time locking and vesting mechanisms to bring best in class token management tools for DAO treasuries. 

There are technical documentation in this repository that describe the contracts functions and uses, and technical requirements. For more information please visit [Hedgey Website](https://hedgey.finance)

The contracts are currently under audit by Hacken. 

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

