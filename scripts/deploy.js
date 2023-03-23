const ethers = require('ethers');
const batchStreamer = require('../artifacts/contracts/BatchStreamer.sol/BatchStreamer.json');
const batchVester = require('../artifacts/contracts/BatchVester.sol/BatchVester.json');
const streamVestingNFT = require('../artifacts/contracts/StreamVestingNFT.sol/StreamVestingNFT.json');
const streamingHedgeys = require('../artifacts/contracts/StreamingHedgeys.sol/StreamingHedgeys.json');
const streamingBoundHedgeys = require('../artifacts/contracts/StreamingBoundHedgeys.sol/StreamingBoundHedgeys.json');
const keys = require('./keys');

async function deployNFT(rpcUrl, artifact, privateKey, args, uriBase) {
    const rpc = rpcUrl;
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const contract = await factory.deploy(...args);
    await contract.deployed();
    console.log(contract.address);
    const uri = `${uriBase}${contract.address.toLowerCase()}/`;
    await contract.updateBaseURI(uri);
    console.log(args);
}

async function deploybatch(rpcUrl, artifact, privateKey) {
    const rpc = rpcUrl;
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const contract = await factory.deploy();
    await contract.deployed();
    console.log(contract.address);
}

async function updateURI(rpcUrl, artifact, privateKey, address, uriBase) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(address, artifact.abi, wallet);
    const uri = `${uriBase}${address.toLowerCase()}/`;
    const tx = await contract.updateBaseURI(uri);
    console.log(tx);
}