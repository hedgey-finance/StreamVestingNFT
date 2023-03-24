import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
const keys = require('./scripts/keys.js');


const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    goerli: {
      url: keys.networks.goerli.url
    },
    mainnet: {
      url: keys.networks.ethereum.url
    },
    optimisticEthereum: {
      url: keys.networks.optimism.url
    },
    bsc: {
      url: keys.networks.bsc.url
    },
    gnosis: {
      url: keys.networks.gnosis.url
    },
    polygon: {
      url: keys.networks.polygon.url
    },
    opera: {
      url: keys.networks.fantom.url
    },
    arbitrumOne: {
      url: keys.networks.arbitrum.url
    },
    avalanche: {
      url: keys.networks.avalanche.url
    },
    harmony: {
      url: keys.networks.harmony.url
    },
    boba: {
      url: keys.networks.boba.url
    }
  },
  etherscan: {
    apiKey: {
      mainnet: keys.networks.ethereum.apiKey,
      goerli: keys.networks.goerli.apiKey,
      optimisticEthereum: keys.networks.optimism.apiKey,
      bsc: keys.networks.bsc.apiKey,
      gnosis: keys.networks.gnosis.apiKey,
      polygon: keys.networks.polygon.apiKey,
      opera: keys.networks.fantom.apiKey,
      arbitrumOne: keys.networks.arbitrum.apiKey,
      avalanche: keys.networks.avalanche.apiKey,
      harmony: keys.networks.harmony.apiKey,
      boba: keys.networks.boba.apiKey,
    },
    customChains: [
      {
        network: "boba",
        chainId: keys.networks.boba.chainID,
        urls: {
          apiURL: keys.networks.boba.url,
          browserURL: "https://bobascan.com/",
        }
      }
    ]
  },
};

export default config;
