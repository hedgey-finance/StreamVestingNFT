const ethers = require('ethers');
const batchStreamer = require('../artifacts/contracts/BatchStreamer.sol/BatchStreamer.json');
const batchVester = require('../artifacts/contracts/BatchVester.sol/BatchVester.json');
const vestingNFT = require('../artifacts/contracts/StreamVestingNFT.sol/StreamVestingNFT.json');
const streamingNFT = require('../artifacts/contracts/StreamingHedgeys.sol/StreamingHedgeys.json');
const streamingBound = require('../artifacts/contracts/StreamingBoundHedgeys.sol/StreamingBoundHedgeys.json');
const keys = require('./keys');

async function deployNFT(rpcUrl, artifact, privateKey, args) {
    const rpc = rpcUrl;
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const contract = await factory.deploy(...args);
    await contract.deployed();
    console.log(contract.address);
    const uri = `https://mthcf2zxy4nudhjmubecmgkch40aeeqt.lambda-url.us-east-1.on.aws/goerli/${contract.address.toLowerCase()}/`;
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

async function updateURI(rpcUrl, artifact, privateKey, address) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(address, artifact.abi, wallet);
    const uri = `https://mthcf2zxy4nudhjmubecmgkch40aeeqt.lambda-url.us-east-1.on.aws/goerli/${address.toLowerCase()}/`;
    await contract.updateBaseURI(uri);
}

const st = '0xe4ade6d8db85f67b7181411ae2109ca27090ae4c';
const bound = '0x2B1507213665757E62a7D7e00dc88FD38F52fd2e';
const vs = '0x6d6E83ea5Db3534e25c5807bfbE71a0c8cDDb85a';
const batchVs = '0x37308b9701A4406e99f2EEF9C86247f01755156C';
const batchSt = '0x9521fD51cC3dA95B4d254CB73b3a3D77e3a86979';
// deploys the contracts
// deployNFT(keys.goerliURL, streamingNFT, keys.wallets.d.privateKey, ['StreamingHedgeys', 'STRMHEDGY']);
// deployNFT(keys.goerliURL, streamingBound, keys.wallets.d.privateKey, ['StreamingBoundHedgeys', 'BOUNDHGY']);
// deployNFT(keys.goerliURL, vestingNFT, keys.wallets.d.privateKey, ['Vesting_Hedgeys', 'VESTHDG', st, bound]);
// use npx hardhat verify --network [network] [contract_address] [args] to verify on etherscan

//deploybatch(keys.goerliURL, batchStreamer, keys.wallets.d.privateKey);

