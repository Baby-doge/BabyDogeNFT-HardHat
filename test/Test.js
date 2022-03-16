const { expect } = require("chai");
const { ethers } = require("hardhat");
const { formatEther, parseEther, formatUnits, parseUnits} = require("@ethersproject/units");
const { MerkleTree} = require("merkletreejs");
const  keccak256  = require("keccak256");
const { providers } = require("ethers");


let owner,
account1,
account2,
account3,
account4,
account5,
account6,
account7,
account8,
account9,
account10,
opensea,
babyDogeNft, whitelistAddresses, leafNodes, merkleTree, hexProof, rootHash;

it("Should set all the accounts", async function () {
    [owner, account1, account2, account3, account4, account5, account6, account7, account8, account9, account10,opensea, _] = await ethers.getSigners();
  
});

it("Should set all the accounts in an array", async function () {
whitelistAddresses = [
account1.address,
account2.address, 
account3.address,
account4.address,
account5.address,
account6.address,
account7.address,
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
    babyDogeNft = await BabyDogeNft.deploy("BabyDogeNFT","BDNFT","https://base", "200");
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
   await babyDogeNft.reserveDoges("98");
   expect(await babyDogeNft.totalSupply()).to.equal(98);
});
it("Should have correct count and ownership", async function () {
    expect(await babyDogeNft.totalSupply()).to.equal(98);
    expect(await babyDogeNft.ownerOf("0")).to.equal(owner.address);
    expect(await babyDogeNft.ownerOf("1")).to.equal(owner.address);
    await expect(babyDogeNft.ownerOf("98")).to.be.reverted;
    await expect(babyDogeNft.ownerOf("99")).to.be.reverted;

 });


it("Should start Presale", async function () {
    await babyDogeNft.setSaleStatus("1");
    expect(await babyDogeNft.getSaleStatus()).to.equal(1)
});

it("should not allow anyone who is not whitelisted to presale Mint", async function (){
    const claimingAddress = account8.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.dogePrice();
    let overrides = {
        value: price
      }
    await expect( babyDogeNft.connect(account8).mintWhitelistDoge("1",hexProof, overrides)).to.be.reverted;
});

it("should allow anyone who is whitelisted to presale Mint", async function (){
    const claimingAddress = account7.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.dogePrice();
    let overrides = {
        value: price
      }
    await babyDogeNft.connect(account7).mintWhitelistDoge("1",hexProof, overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("99")
});

it("should allow anyone who is whitelisted to presale Mint", async function (){
    const claimingAddress = account1.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.dogePrice();
    let overrides = {
        value: price
      }
    await babyDogeNft.connect(account1).mintWhitelistDoge("1",hexProof, overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("100")
});


it("should allow anyone who is whitelisted to presale Mint", async function (){
    const claimingAddress = account5.address;
    const hashedAddress = keccak256(claimingAddress)

    const hexProof = merkleTree.getHexProof(hashedAddress);

    let price = await babyDogeNft.dogePrice();
    let overrides = {
        value: price
      }
    await babyDogeNft.connect(account5).mintWhitelistDoge("1",hexProof, overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("101")
});


it("Should start end presale and start public sale", async function () {
    await babyDogeNft.setSaleStatus("2");
    expect(await babyDogeNft.getSaleStatus()).to.equal(2)
});

it("should keep owners correct", async function (){
let owner = await babyDogeNft.ownerOf("100");
console.log()
expect(owner).to.equal(account5.address)
});

it("Should start end presale and start public sale", async function () {
    await babyDogeNft.setSaleStatus("2");
    expect(await babyDogeNft.getSaleStatus()).to.equal(2)
});

it("should allow anyone to Mint", async function (){
    let price = await babyDogeNft.dogePrice();
    let total = parseInt(price) * 2
    let overrides = {
        value: total.toString()
      }
    console.log("Balance of babydoge", await babyDogeNft.balanceOf(account8.address))
    await babyDogeNft.connect(account8).mintDoge("2", overrides);
    let totalsupply = await babyDogeNft.totalSupply()
    expect(totalsupply).to.equal("103")
    });


it("should not allow anyone to Mint more then they already have", async function (){
  let price = await babyDogeNft.dogePrice();
  let overrides = {
      value: price
    }
  await expect(babyDogeNft.connect(account8).mintDoge("1", overrides)).to.be.reverted;
  let totalsupply = await babyDogeNft.totalSupply()
  expect(totalsupply).to.equal("103")
  });

it("should allow anyone to Mint 2 ", async function (){
        let price = await babyDogeNft.dogePrice();
        let overrides = {
            value: price
          }
        await babyDogeNft.connect(account9).mintDoge("1", overrides);
        let totalsupply = await babyDogeNft.totalSupply()
        expect(totalsupply).to.equal("104")
});


it("should allow owner to withdraw", async function (){
  let ownerBalance = await ethers.provider.getBalance(owner.address)
  console.log("Owner Balance Before", formatEther(ownerBalance))
  await babyDogeNft.withdrawAndLock()
  let ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
  console.log("Owner Balance After", formatEther(ownerBalanceAfter))
});

it("should not allow owner to withdraw again", async function (){
    let ownerBalance = await ethers.provider.getBalance(owner.address)
    console.log("Owner Balance Before", formatEther(ownerBalance))
    await expect(babyDogeNft.withdrawAndLock()).to.be.reverted;
    let ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    console.log("Owner Balance After", formatEther(ownerBalanceAfter))
  });

  it("should allow transfers", async function (){
    await babyDogeNft.connect(account9).setApprovalForAll(opensea.address, true);
    await babyDogeNft.connect(opensea).transferFrom(account9.address, account10.address, "103")
    expect(await babyDogeNft.balanceOf(account10.address)).to.equal(1);
    expect(await babyDogeNft.ownerOf("103")).to.equal(account10.address)
  });

  it("should allow owner transfers second time", async function (){
    await babyDogeNft.setApprovalForAll(opensea.address, true);
    await babyDogeNft.connect(opensea).transferFrom(owner.address, account10.address, "0")
    expect(await babyDogeNft.balanceOf(account10.address)).to.equal(2);
    expect(await babyDogeNft.ownerOf("0")).to.equal(account10.address)
  });

  it("should not allow false transfers", async function (){
    await babyDogeNft.setApprovalForAll(opensea.address, true);
    await expect( babyDogeNft.connect(opensea).transferFrom(owner.address, account9.address, "103")).to.be.reverted;
    expect(await babyDogeNft.balanceOf(account10.address)).to.equal(2);
    expect(await babyDogeNft.ownerOf("103")).to.equal(account10.address)
  });
  