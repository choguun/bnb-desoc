// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract LevelNFT is ERC721, ERC721Enumerable, Ownable { 
        address public hub;

        constructor(address initialOwner, address _hub) 
        ERC721("LevelNFT", "LevelNFT")
        Ownable(initialOwner) 
        {
            hub = _hub;
        }

        modifier onlyHub() {
            require(_msgSender() == hub, "Only hub can call this function");
            _;
        }

        function mint(address _to) public onlyHub {
            _safeMint(_to, totalSupply() + 1);
        }

        function burn(uint256 tokenId) public onlyHub {
            _burn(tokenId);
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