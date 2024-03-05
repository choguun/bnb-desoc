// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {ProfileHandle} from "./ProfileHandle.sol";

contract OsToken is ERC20, Ownable {

    address public profileHandle;
    address public hub;

    constructor(address initialOwner, address _hub, address _profileHandle) ERC20("OsToken", "OST") Ownable(initialOwner) {
        // _mint(msg.sender, 100 * 10 ** uint(decimals()));
        profileHandle = _profileHandle;
        hub = _hub;
    }

    modifier onlyUser() {
        require(ProfileHandle(profileHandle).balanceOf(_msgSender()) > 0, "Only user can call this function");
        _;
    }

    modifier onlyHub() {
        require(_msgSender() == hub, "Only hub can call this function");
        _;
    }

    function setHub(address _hub) public onlyOwner {
        hub = _hub;
    }

    function mint(address to, uint256 _amount) public onlyHub {
        _mint(to, _amount);
    }
}