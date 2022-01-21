pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor(uint256 mintAmount, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _mint(msg.sender, mintAmount);
    }
}
