const { expect } = require("chai");
const { ethers } = require("hardhat");
const { formatEther, parseEther, formatUnits, parseUnits} = require("@ethersproject/units");
const { MerkleTree} = require("merkletreejs");
const  keccak256  = require("keccak256");
const { providers } = require("ethers");
const { getContractFactory } = require("@nomiclabs/hardhat-ethers/types");


let owner,
account1,
account2,
account3,
account4,
account5,
account6,
account7,
account8,
babyDogeNft, whitelistAddresses, leafNodes, merkleTree, hexProof, rootHash;

it("Should set all the accounts", async function () {
    [owner, opensea,account1, account2, account3, account4, account5, account6, account7, account8, account9,account10,_] = await ethers.getSigners();
  
});

it("Should set all the accounts in an array", async function () {
whitelistAddresses = [
account1.address,
account2.address, 
account3.address,
account4.address,
account5.address,
account6.address,
account7.address
]

console.log("Accounts Array",whitelistAddresses )
  });

it("Should set the leaf nodes and create the merkle tree", async function () {
leafNodes = whitelistAddresses.map(addr => keccak256(addr));
merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs: true});

rootHash = merkleTree.getRoot().toString('hex');
console.log("MerkleTree", merkleTree.toString());
});


it("Should attempt to get hex proof for front end", async function () {
const claimingAddress = leafNodes[0];

hexProof = merkleTree.getHexProof(claimingAddress);

const claimingAddress2 = "0x85d30747868a5081f53BC7B9450301e761620a4f";
const hashedAddress = keccak256(claimingAddress2)

const hexProof2 = merkleTree.getHexProof(hashedAddress);

console.log("hexProof", hexProof)
console.log("hexProof2", hexProof2);
});


it("Should deploy the NFT Contract", async function () {
    const BabyDogeNft = await ethers.getContractFactory("BabyDogeNFT");
    babyDogeNft = await BabyDogeNft.deploy("BabyDogeNFT","BDNFT","https://base", "120");
    await babyDogeNft.deployed();
    console.log("babyDogeNFT Address", babyDogeNft.address);
    expect(babyDogeNft.address).to.not.equal("");
});

it("Should set the merkleRoot", async function () {
    console.log("RootHash", rootHash)
    let newRootHash = "0x"+rootHash;
    await babyDogeNft.setMerkleRoot(newRootHash)
});

it("Should should set settings", async function () {
    await babyDogeNft.setSettings("2000", "3000", "0xAC57De9C1A09FeC648E93EB98875B212DB0d460B", "https://base")

});

it("Should be able to reserve doges", async function () {
   await babyDogeNft.reserveDoges("100");
   expect(await babyDogeNft.totalSupply()).to.equal(100);
});

it("Should have correct count and ownership", async function () {
    expect(await babyDogeNft.totalSupply()).to.equal(100);
    expect(await babyDogeNft.ownerOf("0")).to.equal(owner.address);
    expect(await babyDogeNft.ownerOf("1")).to.equal(owner.address);
    expect(await babyDogeNft.ownerOf("98")).to.equal(owner.address);
    await expect(babyDogeNft.ownerOf("100")).to.be.reverted;

 });


it("Should start Presale", async function () {
    await babyDogeNft.setSaleStatus("1");
    expect(await babyDogeNft.getSaleStatus()).to.equal(1)
});

it("should not allow anyone who is not whitelisted to presale Mint", async function (){
    const claimingAddress = account8.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.getCurrentPrice();
    let overrides = {
        value: price
      }
    await expect( babyDogeNft.connect(account8).mintWhitelistDoge("1",hexProof, overrides)).to.be.reverted;
});

it("should allow anyone who is whitelisted to presale Mint", async function (){
    const claimingAddress = account7.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.getCurrentPrice();
        console.log("Price for public sale", formatEther(price));
        let overrides = {
        value: price
      }
    await babyDogeNft.connect(account7).mintWhitelistDoge("1",hexProof, overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("101")
});

it("should allow anyone who is whitelisted to presale Mint", async function (){
    const claimingAddress = account1.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.getCurrentPrice();
    console.log("Price for public sale", formatEther(price));
    let overrides = {
        value: price
      }
    await babyDogeNft.connect(account1).mintWhitelistDoge("1",hexProof, overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("102")
});


it("should allow anyone who is whitelisted to presale Mint", async function (){
    const claimingAddress = account5.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.getCurrentPrice();
    console.log("Price for public sale", formatEther(price));
    let overrides = {
        value: price
      }
    await babyDogeNft.connect(account5).mintWhitelistDoge("1",hexProof, overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("103")
});


it("Should start end presale and start public sale", async function () {
    await babyDogeNft.setSaleStatus("2");
    expect(await babyDogeNft.getSaleStatus()).to.equal(2)
});

it("should keep owners correct", async function (){

let owner = await babyDogeNft.ownerOf("102");
console.log()
expect(owner).to.equal(account5.address)
});

it("Should start end presale and start public sale", async function () {
    await babyDogeNft.setSaleStatus("2");
    expect(await babyDogeNft.getSaleStatus()).to.equal(2)
});


it("should allow anyone to Mint", async function (){
    let price = await babyDogeNft.getCurrentPrice();
    console.log("Price for public sale", formatEther(price));

    let overrides = {
        value: price
      }
    await babyDogeNft.connect(account8).mintDoge("1", overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("104")
    });

it("should allow anyone to Mint 2 ", async function (){
    await network.provider.send("evm_increaseTime", [1100])
await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp
        let price = await babyDogeNft.getCurrentPrice();
        console.log("Price for public sale at the end", formatEther(price));

        price = (parseInt(price) * 2).toString();
        console.log("Price for public sale at the end total", formatEther(price));
        let overrides = {
            value: price
          }
        await babyDogeNft.connect(account9).mintDoge("2", overrides);
        let totalsupply = await babyDogeNft.totalSupply()
        expect(totalsupply).to.equal("106")
});


it("should allow owner to withdraw", async function (){
  let ownerBalance = await ethers.provider.getBalance(owner.address)
  console.log("Owner Balance Before", formatEther(ownerBalance))
  await babyDogeNft.withdrawAndLock()
  let ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
  console.log("Owner Balance After", formatEther(ownerBalanceAfter))
});


it("should allow transfers", async function (){
    await babyDogeNft.connect(account9).setApprovalForAll(opensea.address, true);
    await babyDogeNft.connect(opensea).transferFrom(account9.address, account10.address, "105")
    expect(await babyDogeNft.balanceOf(account10.address)).to.equal(1);
    expect(await babyDogeNft.ownerOf("105")).to.equal(account10.address)
  });

  it("should allow owner transfers", async function (){
    await babyDogeNft.setApprovalForAll(opensea.address, true);
    await babyDogeNft.connect(opensea).transferFrom(owner.address, account10.address, "0")
    expect(await babyDogeNft.balanceOf(account10.address)).to.equal(2);
    expect(await babyDogeNft.ownerOf("0")).to.equal(account10.address)
  });

  it("should not allow false transfers", async function (){
    await babyDogeNft.setApprovalForAll(opensea.address, true);
    await expect( babyDogeNft.connect(opensea).transferFrom(owner.address, account10.address, "104")).to.be.reverted;
    expect(await babyDogeNft.balanceOf(account10.address)).to.equal(2);
    expect(await babyDogeNft.ownerOf("104")).to.equal(account9.address)
  });
  


  //time to test the pool 
  it("should create instance of link contract", async function (){
    let myWallet = new ethers.Wallet("1bb762e4017a9e238c455b7f4c5542e738664f8e672a620083dedbcbd8c44c39")
    console.log("my wallet address 0x85", myWallet.address);
   let linkToken = await ethers.getContractAt("linktoken.sol", "0x01BE23585060835E02B77ef475b0Cc51aA1e0709")
   console.log("Wallet link", await linkToken.balanceOf(wallet.address))
     
  });

  it("should load contract with link tokens", async function (){
    
     
});