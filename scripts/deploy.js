const ethers = require('ethers');
const batchStreamer = require('../artifacts/contracts/BatchStreamer.sol/BatchStreamer.json');
const batchVester = require('../artifacts/contracts/BatchVesting.sol/BatchVester.json');
const vestingNFT = require('../artifacts/contracts/StreamVestingNFT.sol/StreamVestingNFT.json');
const streamingNFT = require('../artifacts/contracts/StreamingNFT.sol/StreamingHedgeys.json');
const streamingBound = require('../artifacts/contracts/StreamingBoundNFT.sol/StreamingBoundHedgeys.json');
const keys = require('./keys');

async function deploy(artifact, args, privateKey) {
    const rpc = keys.goerliURL;
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const contract = await factory.deploy(args);
    await contract.deployed();
    console.log(contract.address);
    console.log(args);
}

// deploy the contract
// use npx hardhat verify --network [network] [contract_address] [args] to verify on etherscan