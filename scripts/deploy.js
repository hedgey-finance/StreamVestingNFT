const ethers = require('ethers');

async function deploy(contractName, network, args) {
    const artifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    const url = `${network}_URL`;
    const rpc = process.env[url];
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(process.env.privateKey, provider);
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const contract = await factory.deploy(args);
    console.log(contract.target);
}