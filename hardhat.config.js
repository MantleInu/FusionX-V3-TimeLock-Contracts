require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
const PRIVATE_KEY =
  process.env.PRIVATE_KEY

module.exports = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
    networks: {
    mantleTestnet: {
      url: "https://rpc.testnet.mantle.xyz/",
      chainId: 5001,
      accounts: [PRIVATE_KEY],
    },
    mantle: {
      url: "https://rpc.mantle.xyz/",
      chainId: 5000,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      mantle: 'xyz', //random value
    },
    customChains: [
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://explorer.mantle.xyz/api",
          browserURL: "https://explorer.mantle.xyz"
        },
      },
    ],
  }
};
