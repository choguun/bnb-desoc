// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ProfileHandle is ERC721, ERC721Enumerable, Ownable {  

    mapping(uint256 => string) public profileHandle; // tokenId => handle
    mapping(string => uint256) public handleToTokenId; // handle => tokenId
    uint256 public price = 0.01 ether; // 0.01 BNB

    constructor(address initialOwner) ERC721("ProfileHandle", "ProfileHandle") Ownable(initialOwner) {}
    
    function registerHandle(string memory name) external payable {
        mint(msg.sender, name);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
    }

    function mint(address _to, string memory name) public payable {
        require(msg.value >= price, "Insufficient amount");
        require(handleToTokenId[name] == 0, "Handle already exists");
        require(this.balanceOf(_msgSender()) == 0, "Only one profile handle per wallet");

        _safeMint(_to, totalSupply() + 1);
        handleToTokenId[name] = totalSupply();
        profileHandle[totalSupply()] = name;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
      return super.supportsInterface(interfaceId);
    }
    
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
      super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
      return super._update(to, tokenId, auth);
    }

    
}