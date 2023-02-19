import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
const keys = require('./scripts/keys');

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
      url: keys.goerliURL,
    },
    mainnet: {
      url: keys.mainnetURL,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: keys.etherscanAPI,
      goerli: keys.etherscanAPI,
    },
  },
};

export default config;
