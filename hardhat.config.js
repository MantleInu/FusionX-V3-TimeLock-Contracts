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
      buildbear: {
        url: "https://rpc.buildbear.io/ruling-sly-moore-9a39229b",  
            accounts: [PRIVATE_KEY],
      },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
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
      buildbear: "verifyContract",
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
      {
        network: "buildbear",
        chainId: 9929,
        urls: {
          apiURL: "https://rpc.buildbear.io/verify/etherscan/ruling-sly-moore-9a39229b",
          browserURL: "https://explorer.buildbear.io/ruling-sly-moore-9a39229b",
        },
      },
    ],
  }
};
