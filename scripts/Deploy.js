const { formatEther, parseEther } = require("@ethersproject/units");
//const { ethers } = require("ethers");
const { ethers } = require("hardhat");

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
  // // Hardhat always runs the compile task when running scripts with its command
  // console.log("starting deployment")
  // const BabyDogeNFT = await ethers.getContractFactory("BabyDoge");
  // let babyDogeNft = await BabyDogeNFT.deploy("BabyDoge", "BabyDoge", "https://ipfs.io/ipfs/QmQQCTSBhkmBtj23pNLJkg9rt7EWPtsmXcVbDz3efqXhuV/", "10000");
  // await babyDogeNft.deployed();
  // console.log("BabyDogeNFT deployed to:", babyDogeNft.address);

  // await delay(30000);

  try {
    // //https://ipfs.io/ipfs/QmQQCTSBhkmBtj23pNLJkg9rt7EWPtsmXcVbDz3efqXhuV/
    await hre.run("verify:verify", {
      address: "0x4eE183A1C39a537591636AdCcE213F1ACE0D6e5a",
      constructorArguments: ["BabyDoge", "BabyDoge", "https://ipfs.io/ipfs/QmQQCTSBhkmBtj23pNLJkg9rt7EWPtsmXcVbDz3efqXhuV/", "10000"]
    });
  } catch (e) {
    console.log(e);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });