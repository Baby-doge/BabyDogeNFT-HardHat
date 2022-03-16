const { MerkleTree} = require("merkletreejs");
const  keccak256  = require("keccak256");

let whitelist = [
    "0x85d30747868a5081f53BC7B9450301e761620a4f",
    "0x375CDCB6018f4c24C6380c72AdF4328baBD914Ba",
    "0x37F023116F67323821b0b523E935071Fb5603f9b",
    "0x96f2568cb3794611Ee80C22e2D32F504aA273738",
    "0x9b727D2297f334740cF6BC6c454eBb0604770aad"
]

it("Should set the leaf nodes and create the merkle tree", async function () {
    leafNodes = whitelist.map(addr => keccak256(addr));
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
    console.log("RootHash", rootHash)
    let newRootHash = "0x"+rootHash;
    console.log("Hex root hash",newRootHash);
    });

    it("Should set the leaf nodes and create the merkle tree", async function () {
        const claimingAddress2 = "0x37F023116F67323821b0b523E935071Fb5603f9b";
        const hashedAddress = keccak256(claimingAddress2)
        const hexProof2 = merkleTree.getHexProof(hashedAddress);
        console.log("Input", hexProof2)
    });
    