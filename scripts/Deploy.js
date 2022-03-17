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
  // const BabyDogeNFT = await ethers.getContractFactory("BabyDogeNFT");
  // let babyDogeNft = await BabyDogeNFT.deploy("BabyDoge Army", "BabyDogeArmyNFT", "https://ipfs.io/ipfs/QmQQCTSBhkmBtj23pNLJkg9rt7EWPtsmXcVbDz3efqXhuV/", "10000");
  // await babyDogeNft.deployed();
  // console.log("BabyDogeNFT deployed to:", babyDogeNft.address);

  // //babyDogeBurner = await ethers.getContractAt("0x375CDCB6018f4c24C6380c72AdF4328baBD914Ba", "0x37F023116F67323821b0b523E935071Fb5603f9b", "0x85d30747868a5081f53BC7B9450301e761620a4f", "0x85d30747868a5081f53BC7B9450301e761620a4f", babyDoge.address, uniswapRouter);

  // await delay(30000);

  try {
    //https://ipfs.io/ipfs/QmQQCTSBhkmBtj23pNLJkg9rt7EWPtsmXcVbDz3efqXhuV/
    await hre.run("verify:verify", {
      address: "0x5aa43ff2024A7d214a9bfAd061052Ba29Fb029D4",
      constructorArguments: ["BabyDoge Army", "BabyDogeArmyNFT", "https://ipfs.io/ipfs/QmQQCTSBhkmBtj23pNLJkg9rt7EWPtsmXcVbDz3efqXhuV/", "10000"]
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