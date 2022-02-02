// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./uniswap/IUniswapV2Router02.sol";
import "./uniswap/IUniswapV2Factory.sol";
import "./uniswap/IUniswapV2Pair.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract BabyDogeNFT is
    VRFConsumerBase,
    ERC721Enumerable,
    Ownable,
    ReentrancyGuard
{
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using Address for *;
    uint16 internal devTeamPercent;
    uint16 internal lotoPercent;
    bytes32 internal immutable keyHash;
    string private _baseTokenURI;
    address private constant FACTORY =
        0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address private constant ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address internal babyDogeToken;
    uint256 public REVEAL_TIMESTAMP;
    uint256 internal startingIndexBlock;
    uint256 public constant dogePrice = 1e17; //0.1 ETH
    uint256 internal maxDogePurchase = 1;
    uint256 internal immutable MAX_DOGES;
    uint256 internal constant ITERATION_PERIOD = 4 weeks;
    bool internal withdrawIsLocked;
    bool public ethPayout = true;
    uint256 internal immutable fee;
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

    event LottoClaimed(uint256 _id, uint256 _prize);
    event WinnersPicked(uint256[] _ids);
    event SetSettings(
        uint256 _devTeamPercent,
        uint256 _lotoPercent,
        address _babydoge,
        string _URI
    );
    event FlipEthPayout(bool _ethPayout);
    event SaleStatusSet(uint256 _saleStatus);
    event MaxMintSet(uint256 _maxMint);
    event WithdrawAndLock(bool _withdrawAndLock);
    event ReserveDoges(uint256 _amount);
    event RevealTimeSet(uint256 _timestamp);
    event MerkleRootSet(bytes32 _merkleRoot);

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

    function flipEthPayout() external onlyOwner {
        ethPayout = !ethPayout;
        nextRewardNonce();
        emit FlipEthPayout(ethPayout);
    }

    function setSettings(
        uint16 _devTeamPercent,
        uint16 _lotoPercent,
        address _babyDogeToken,
        string memory _baseURILink
    ) external onlyOwner {
        require(
            _babyDogeToken != address(0),
            "Error: Token can't be the zero address"
        );
        devTeamPercent = _devTeamPercent;
        lotoPercent = _lotoPercent;
        babyDogeToken = _babyDogeToken;
        _baseTokenURI = _baseURILink;
        emit SetSettings(
            devTeamPercent,
            lotoPercent,
            babyDogeToken,
            _baseTokenURI
        );
    }

    // Set uint
    // Closed  - 0
    // Whitelist  - 1
    // Public - 2
    function setSaleStatus(SaleStatus _saleStatus) external onlyOwner {
        saleStatus = _saleStatus;
        emit SaleStatusSet(uint256(saleStatus));
    }

    function getSaleStatus() public view returns (uint256) {
        return uint256(saleStatus);
    }

    function setMaxMint(uint256 _maxDogePurchase) external onlyOwner {
        maxDogePurchase = _maxDogePurchase;
        emit MaxMintSet(maxDogePurchase);
    }

    function withdrawAndLock() external onlyOwner {
        require(withdrawIsLocked == false);
        withdrawIsLocked = true;
        payable(owner()).sendValue(address(this).balance);
        emit WithdrawAndLock(withdrawIsLocked);
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
        uint256 amountInWithFee = _amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
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
    function reserveDoges(uint256 _amount) external onlyOwner {
        uint256 supply = totalSupply();
        uint256 i;
        for (i = 0; i < _amount; i++) {
            _safeMint(msg.sender, supply + i + 1);
        }
        emit ReserveDoges(_amount);
    }

    function setRevealTimestamp(uint256 revealTimeStamp) external onlyOwner {
        REVEAL_TIMESTAMP = revealTimeStamp;
        emit RevealTimeSet(REVEAL_TIMESTAMP);
    }

    /**
     * Mints DOGES
     */
    function mintDoge(uint256 numberOfTokens) external payable {
        require(
            saleStatus == SaleStatus.Public,
            "error: public sale has not started yet"
        );
        require(
            numberOfTokens <= maxDogePurchase,
            "error: you can't mint that many doges"
        );
        require(
            totalSupply() + numberOfTokens <= MAX_DOGES,
            "error: total supply has been reached"
        );
        require(
            dogePrice * numberOfTokens <= msg.value,
            "error: not enough Eth"
        );

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
        require(
            ownerOf(_id) == msg.sender,
            "error: you dont own a winning doge"
        );
        uint256 prize;
        for (uint256 i = 0; i < toClaimPrize.length; i++) {
            if (toClaimPrize[i] == _id) {
                prize = prizePool / toClaimPrize.length;
                prizePool = prizePool - prize;
                for (uint256 a = i; a < toClaimPrize.length - 1; a++) {
                    toClaimPrize[a] = toClaimPrize[a + 1];
                }
                toClaimPrize.pop();
                if (ethPayout) {
                    payable(ownerOf(_id)).sendValue(prize);
                } else {
                    IERC20(babyDogeToken).safeTransfer(ownerOf(_id), prize);
                }
            }
        }
        require(prize > 0, "error: prize must be greater then 0");
        emit LottoClaimed(_id, prize);
    }

    function nextRewardNonce() public nonReentrant returns (bytes32 requestId) {
        require(
            withdrawIsLocked,
            "error: can't call nextRewardNonce before the sale is over"
        );
        uint256 teamPortion;
        require(
            block.timestamp >
                iterationTime[currentIteration.current()] + ITERATION_PERIOD,
            "error: iteration period has not passed"
        );
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with Link"
        );
        currentIteration.increment();
        iterationTime[currentIteration.current()] = block.timestamp;
        iterationToClaim[currentIteration.current()] = totalSupply();
        uint256 balance;
        if (ethPayout) {
            balance = address(this).balance;
            teamPortion = (balance * devTeamPercent) / 10000;
            payable(owner()).sendValue(teamPortion);
            prizePool = (balance * lotoPercent) / 10000;
        } else {
            convertETHToBabyDoge();
            balance = IERC20(babyDogeToken).balanceOf(address(this));
            teamPortion = (balance * devTeamPercent) / 10000;
            IERC20(babyDogeToken).safeTransfer(owner(), teamPortion);
            prizePool = (balance * lotoPercent) / 10000;
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
        uint256 randInt = (randomness % totalSupply()) - 500;
        winners = [randInt, randInt + 500, randInt + 400, randInt + 300];
        toClaimPrize = [randInt, randInt + 500, randInt + 400, randInt + 300];
        emit WinnersPicked(winners);
    }

    function getCurrentWinners() public view returns (uint256[] memory) {
        return winners;
    }

    bytes32 public merkleRoot;

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootSet(merkleRoot);
    }

    mapping(address => bool) whitelistClaimed;

    function mintWhitelistDoge(
        uint256 numberOfTokens,
        bytes32[] calldata _merkleProof
    ) external payable {
        require(
            saleStatus == SaleStatus.Whitelist,
            "Whitelist sale has not started"
        );
        require(!whitelistClaimed[msg.sender], "You have already Minted");

        require(
            numberOfTokens <= maxDogePurchase,
            "You can't mint that many Doges"
        );
        require(
            totalSupply() + numberOfTokens <= MAX_DOGES,
            "Unable to mint: would exceed total supply, try minting less"
        );
        require(dogePrice * numberOfTokens <= msg.value, "Not enough ETH");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "You aren't on the whitelist"
        );

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
