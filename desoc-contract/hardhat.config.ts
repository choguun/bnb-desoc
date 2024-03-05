import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999,
      },
    },
  },
  networks: {
    hardhat: {
    },
    testnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts: [''],
      gasPrice: 35000000000,
    },
    mainnet: {
      url: `https://bsc-dataseed1.binance.org`,
      accounts: ['']
    }
  },
  etherscan: {
    apiKey: "",
  },
  sourcify: {
    enabled: false
  }
};

export default config;
