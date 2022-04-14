const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

let whitelist = ["0xeffC87E1745e440C294a6082F18458B01F2D3171"];

it("Should set the leaf nodes and create the merkle tree", async function () {
  leafNodes = whitelist.map((addr) => keccak256(addr));
  merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  rootHash = merkleTree.getRoot().toString("hex");
  console.log("MerkleTree", merkleTree.toString());
});

it("Should attempt to get hex proof for front end", async function () {
  const claimingAddress = leafNodes[0];

  hexProof = merkleTree.getHexProof(claimingAddress);

  const claimingAddress2 = "0x85d30747868a5081f53BC7B9450301e761620a4f";
  const hashedAddress = keccak256(claimingAddress2);

  const hexProof2 = merkleTree.getHexProof(hashedAddress);

  console.log("hexProof", hexProof);
  console.log("hexProof2", hexProof2);
  console.log("RootHash", rootHash);
  let newRootHash = "0x" + rootHash;
  console.log("Hex root hash", newRootHash);
});

it("Should set the leaf nodes and create the merkle tree", async function () {
  const claimingAddress2 = "0x37F023116F67323821b0b523E935071Fb5603f9b";
  const hashedAddress = keccak256(claimingAddress2);
  const hexProof2 = merkleTree.getHexProof(hashedAddress);
  console.log("Input", hexProof2);
});
