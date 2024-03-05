// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract PostNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable { 
        uint256 public price; 
        uint256 public supply;
        address public postOwner;
        uint256 public postNo;
        string public contentURI;

        constructor(string memory name, address initialOwner, address _postOwner, uint256 _price, uint256 _supply, uint256 _postNo, string memory _tokenURI) 
        ERC721(name, name)
        Ownable(initialOwner) 
        {
            price = _price;
            supply = _supply;
            postOwner = _postOwner;
            postNo = _postNo;
            contentURI = _tokenURI;
        }

        modifier onlyPostOwner() {
            require(postOwner == _msgSender(), "Only post owner can call this function");
            _;
        }

        function mint(address _to) public payable {
            require(msg.value >= price, "Insufficient amount");

            _safeMint(_to, totalSupply() + 1);
        }

        function withdraw() public onlyPostOwner {
            payable(msg.sender).transfer(address(this).balance);
        }

        function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
            return super.supportsInterface(interfaceId);
        }
        
        function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
            super._increaseBalance(account, value);
        }

        function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
            return super._update(to, tokenId, auth);
        }
        
        function tokenURI(uint256) public view override(ERC721, ERC721URIStorage) returns (string memory) {
            return contentURI;
        }
}