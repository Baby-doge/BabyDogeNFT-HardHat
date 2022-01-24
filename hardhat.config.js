/* eslint-disable */

require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers:[
      {
        version: "0.6.12",
        settings: {},
      },
      {
        version: "0.7.0",
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
          enabled: true,
          runs: 200,
        },}
      },
      {
        version: "0.4.16",
        settings: {},
      },
      {
        version: "0.4.18",
      },
      {
        version: "0.7.6",
        settings: {},
      },
      
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url:"https://eth-mainnet.alchemyapi.io/v2/VISoDFe0KvkxJ9gFiHPhohqxEFXOOlCt",
        //process.env.KOVAN_URL, // must be archive node for next line to work
        gas: "auto",
        gasPrice: "auto",
        timeout: 20000,
        //blockNumber: 29345600, // block pinning gives x20 perfromance due to caching as stated on hardhat docs
        enabled: true,
      },
    },
    kovan: {
      url: process.env.KOVAN_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gas: "auto",
      gasMultiplier: 2
    },
    bscTestnet: {
      url: process.env.BSC_TEST_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    bsc: {
      url: process.env.BSC_MAINNET_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: true !== undefined,
    currency: "USD",
    coinmarketcap: "de90468f-f078-435a-8fdd-db21bc782f19"
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
};
