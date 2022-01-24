// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./uniswap/IUniswapV2Router02.sol";
import "./uniswap/IUniswapV2Factory.sol";
import "./uniswap/IUniswapV2Pair.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract BabyDogeNFT is
    VRFConsumerBase,
    ERC721Enumerable,
    Ownable,
    ReentrancyGuard
{
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    Counters.Counter private _tokenIdTracker;
    uint16 internal devTeamPercent;
    uint16 internal lotoPercent;
    bytes32 internal keyHash;
    string private _baseTokenURI;
    address private constant FACTORY =
        0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address private constant ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address internal babyDogeToken;
    uint256 public REVEAL_TIMESTAMP;
    uint256 internal startingIndexBlock;
    uint256 internal startingIndex;
    uint256 public constant dogePrice = 100000000000000; //0.0001 ETH
    uint256 internal maxDogePurchase = 1;
    uint256 internal MAX_DOGES;
    uint256 internal constant ITERATION_PERIOD = 4 weeks;
    bool public saleIsActive = false;
    bool internal withdrawIsLocked = false;
    bool public ethPayout = true;
    uint256 internal fee;
    uint256 public prizePool;
    uint256[] public winners;
    uint256[] private toClaimPrize;

    // Returns uint
    // Closed  - 0
    // Whitelist  - 1
    // Public - 2
    enum SaleStatus {
        Closed,
        Whitelist,
        Public
    }

    SaleStatus public saleStatus;

    /**
    Naming to change later -> DOGES, Doges, Doge
     */

    //Events Added post Audit
    event LottoClaimed(uint256 _id, uint256 _prize);
    event WinnersPicked(uint256[] _ids);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        uint256 maxNftSupply
    )
        ERC721(name, symbol)
        VRFConsumerBase(
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B,
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709
        )
    {
        _baseTokenURI = baseTokenURI;
        MAX_DOGES = maxNftSupply;
        keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
        fee = 2 * 10**18; // 0.1 LINK (Varies by network)
    }

    /*
     * @param Iteration
     * @param NFT ID
     */
    mapping(uint256 => mapping(uint256 => bool)) internal iterationClaimed;
    mapping(uint256 => uint256) internal iterationTime;
    mapping(uint256 => uint256) internal iterationToClaim;

    Counters.Counter public currentIteration;

    receive() external payable {}

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function flipEthPayout() public onlyOwner {
        ethPayout = !ethPayout;
        nextRewardNonce();
    }

    function setSettings(
        uint16 _devTeamPercent,
        uint16 _lotoPercent,
        address _babyDogeToken,
        string memory _baseURILink
    ) external onlyOwner {
        devTeamPercent = _devTeamPercent;
        lotoPercent = _lotoPercent;
        babyDogeToken = _babyDogeToken;
        _baseTokenURI = _baseURILink;
    }

    // Set uint
    // Closed  - 0
    // Whitelist  - 1
    // Public - 2
    function setSaleStatus(SaleStatus _saleStatus) public onlyOwner {
        saleStatus = _saleStatus;
    }

    function getSaleStatus() public view returns (SaleStatus) {
        return saleStatus;
    }

    function setMaxMint(uint256 _maxDogePurchase) public onlyOwner {
        maxDogePurchase = _maxDogePurchase;
    }

    function withdrawAndLock() public onlyOwner {
        require(withdrawIsLocked == false);
        withdrawIsLocked = true;
        payable(owner()).transfer(address(this).balance);
    }

    function convertETHToBabyDoge() internal {
        _swapTokens(
            babyDogeToken,
            _getQuote(
                address(this).balance,
                IUniswapV2Router02(ROUTER).WETH(),
                babyDogeToken
            )
        );
    }

    function _getQuote(
        uint256 _amountIn,
        address _fromTokenAddress,
        address _toTokenAddress
    ) internal view returns (uint256 amountOut) {
        address pair = IUniswapV2Factory(FACTORY).getPair(
            _fromTokenAddress,
            _toTokenAddress
        );
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair)
            .getReserves();
        address token0 = IUniswapV2Pair(pair).token0();
        (uint256 reserveIn, uint256 reserveOut) = token0 == _fromTokenAddress
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        uint256 amountInWithFee = _amountIn.mul(997);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator.div(denominator);
    }

    function _swapTokens(address _ToTokenContractAddress, uint256 amountOut)
        internal
    {
        uint256 balance = address(this).balance;
        address[] memory path = new address[](2);
        path[0] = IUniswapV2Router02(ROUTER).WETH();
        path[1] = _ToTokenContractAddress;

        IUniswapV2Router02(ROUTER).swapExactETHForTokens{value: balance}(
            amountOut,
            path,
            address(this),
            block.timestamp + 700
        )[path.length - 1];
    }

    /**
     * Set some DOGES aside
     */
    function reserveDoges(uint256 _ammount) public onlyOwner {
        uint256 supply = totalSupply();
        uint256 i;
        for (i = 0; i < _ammount; i++) {
            _safeMint(msg.sender, supply + i + 1);
        }
    }

    function setRevealTimestamp(uint256 revealTimeStamp) public onlyOwner {
        REVEAL_TIMESTAMP = revealTimeStamp;
    }

    /**
     * Mints DOGES
     */
    function mintDoge(uint256 numberOfTokens) public payable {
        require(saleStatus == SaleStatus.Public);
        require(numberOfTokens <= maxDogePurchase);
        require(totalSupply().add(numberOfTokens) <= MAX_DOGES);
        require(dogePrice.mul(numberOfTokens) <= msg.value);

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 mintIndex = totalSupply() + 1;
            if (totalSupply() < MAX_DOGES) {
                _safeMint(msg.sender, mintIndex);
            }
        }

        if (
            startingIndexBlock == 0 &&
            (totalSupply() == MAX_DOGES || block.timestamp >= REVEAL_TIMESTAMP)
        ) {
            startingIndexBlock = block.number;
        }
    }

    function claimLotto(uint256 _id) external nonReentrant {
        require(ownerOf(_id) == msg.sender);
        uint256 prize;
        for (uint256 i = 0; i < toClaimPrize.length; i++) {
            if (toClaimPrize[i] == _id) {
                prize = prizePool.div(toClaimPrize.length);
                prizePool = prizePool.sub(prize);
                for (uint256 a = i; a < toClaimPrize.length - 1; a++) {
                    toClaimPrize[a] = toClaimPrize[a + 1];
                }
                toClaimPrize.pop();
                if (ethPayout) {
                    payable(ownerOf(_id)).transfer(prize);
                } else {
                    IERC20(babyDogeToken).transfer(ownerOf(_id), prize);
                }
            }
        }
        require(prize > 0);
        //Added post audit
        emit LottoClaimed(_id, prize);
    }

    function nextRewardNonce() public returns (bytes32 requestId) {
        require(withdrawIsLocked == true);
        uint256 teamPortion;
        require(
            block.timestamp >
                iterationTime[currentIteration.current()].add(ITERATION_PERIOD)
        );
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );
        currentIteration.increment();
        iterationTime[currentIteration.current()] = block.timestamp;
        iterationToClaim[currentIteration.current()] = totalSupply();
        uint256 balance;
        if (ethPayout) {
            balance = address(this).balance;
            teamPortion = balance.mul(devTeamPercent).div(10000);
            payable(owner()).transfer(teamPortion);
            prizePool = balance.mul(lotoPercent).div(10000);
        } else {
            convertETHToBabyDoge();
            balance = IERC20(babyDogeToken).balanceOf(address(this));
            teamPortion = balance.mul(devTeamPercent).div(10000);
            IERC20(babyDogeToken).transfer(owner(), teamPortion);
            prizePool = balance.mul(lotoPercent).div(10000);
        }
        return requestRandomness(keyHash, fee);
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        uint256 randInt = randomness % totalSupply().sub(500);
        winners = [
            randInt,
            randInt.add(500),
            randInt.add(400),
            randInt.add(300)
        ];
        toClaimPrize = [
            randInt,
            randInt.add(500),
            randInt.add(400),
            randInt.add(300)
        ];
        //Added post audit
        emit WinnersPicked(winners);
    }

    //Added post audit
    function getCurrentWinners() public view returns (uint256[] memory) {
        return winners;
    }

    function getMaxDogesPurchaseable() public view returns (uint256) {
        return maxDogePurchase;
    }

    // vvvvvvvvvvvvvvvvvvv MerkleTree WhiteList vvvvvvvvvvvvvvvvvvv
    bytes32 public merkleRoot;

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    mapping(address => bool) whitelistClaimed;

    function mintWhitelistDoge(
        uint256 numberOfTokens,
        bytes32[] calldata _merkleProof
    ) public payable {
        require(saleStatus == SaleStatus.Whitelist);
        require(!whitelistClaimed[msg.sender]);

        require(numberOfTokens <= maxDogePurchase);
        require(totalSupply().add(numberOfTokens) <= MAX_DOGES);
        require(dogePrice.mul(numberOfTokens) <= msg.value);
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf));

        whitelistClaimed[msg.sender] = true;

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 mintIndex = totalSupply() + 1;
            if (totalSupply() < MAX_DOGES) {
                _safeMint(msg.sender, mintIndex);
            }
        }

        if (
            startingIndexBlock == 0 &&
            (totalSupply() == MAX_DOGES || block.timestamp >= REVEAL_TIMESTAMP)
        ) {
            startingIndexBlock = block.number;
        }
    }
}
