// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {ProfileHandle} from "./ProfileHandle.sol";
import {PostNFT} from "./PostNFT.sol";
import {OsToken} from "./OsToken.sol";
import {ERC6551Registry} from "./ERC6551Registry.sol";
import {ERC6551Account} from "./ERC6551Account.sol";
import {ExpToken} from "./ExpToken.sol";
import {LevelNFT} from "./LevelNFT.sol";

contract OasisHub is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Post {
        uint256 postNo;
        string profileHandle;
        string contentURI;
    }

    // external address //
    address public profileHandle; // Profile Handle
    address public osToken; // Platform Token
    address public tkRegistry; // Token Bound Registry
    address public tkAccount; // Token Bound Account
    address public expToken; // EXP Token
    address public levelNFT; // Level NFT
    uint256 public chainId;
    // external address //

    // Social data //
    mapping(uint256 => mapping(uint256 => Post)) public postwithProfile; // tokenId => post token id count => Post
    mapping(uint256 => string) public handlebyPostNo; // tokenNo => handle name
    mapping(uint256 => uint256) public tokenIdbyPostNo; // postNo => tokenId
    mapping(uint256 => uint256) public likeCount; // postNo => like count
    mapping(uint256 => uint256) public dislikeCount; // postNo => like count
    mapping(uint256 => uint256) public tipCount; // postNo => tip count
    mapping(uint256 => uint256) public postTokenIdCount; // tokenId => post token id count
    mapping(uint256 => address) public nft; // postNo => NFT
    mapping(uint256 => bool) public isPostTokenized; // postNo => IsTokenize 1 or 0
    Post[] public postArray;
    // Social data //

    // Gamfication data //
    mapping(address => uint256) public lastCheckIn;

    // Gamfication data //

    uint256 public postCount = 0;
    uint256 public fees = 0.01 ether;

    modifier onlyUser() {
        require(ProfileHandle(profileHandle).balanceOf(_msgSender()) > 0, "Only user can call this function");
        _;
    }

    modifier onlyTokenOwner(uint256 _tokenId) {
        require(ProfileHandle(profileHandle).ownerOf(_tokenId) == _msgSender(), "You are not the owner of profile handle");
        _;
    }

    receive() external payable {}

    function initialize(address _profilehandle, address _token, address _registry, address _account, uint256 _chainId, address _exp, address _level) public initializer {
        __UUPSUpgradeable_init();
        __Ownable_init(_msgSender());
        profileHandle = _profilehandle;
        osToken = _token;
        tkRegistry = _registry;
        tkAccount = _account;
        expToken = _exp;
        levelNFT = _level;
        chainId = _chainId;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getPosts() external view returns(Post[] memory) {
        return postArray;
    }

    function getNFT(uint256 _postNo) external view returns(address) {
        return nft[_postNo];
    }

    function getIsTokenized(uint256 _postNo) external view returns(bool) {
        return isPostTokenized[_postNo];
    }

    // SOCIAL FUNCTIONS //
    function createPost(uint256 _tokenId, string memory _contentURI) external onlyUser {
        require(ProfileHandle(profileHandle).ownerOf(_tokenId) == _msgSender(), "Only owner of the token can create post");

        postTokenIdCount[_tokenId] += 1;
        postCount += 1;

        Post memory postData;
        postData.postNo = postCount;
        postData.profileHandle = ProfileHandle(profileHandle).profileHandle(_tokenId);
        postData.contentURI = _contentURI;

        postArray.push(postData);
        postwithProfile[_tokenId][postTokenIdCount[_tokenId]] = postData;
        handlebyPostNo[postCount] = postData.profileHandle;
        tokenIdbyPostNo[postCount] = _tokenId;
    }

    function likePost(uint256 _postId) external onlyUser {
        likeCount[_postId] += 1;
    }

    function dislikePost(uint256 _postId) external onlyUser {
        dislikeCount[_postId] += 1;
    }

    function tipPost(uint256 _postNo, uint256 _amount) external onlyUser nonReentrant {
        require(IERC20(osToken).balanceOf(_msgSender()) > 0, "Insufficient balance");

        string memory handleName = handlebyPostNo[_postNo];
        uint256 tokenId = ProfileHandle(profileHandle).handleToTokenId(handleName);
        address receiver = ProfileHandle(profileHandle).ownerOf(tokenId);
        tipCount[_postNo] += _amount;

        IERC20(osToken).safeTransferFrom(_msgSender(), address(this), _amount);
        IERC20(osToken).safeTransfer(receiver, _amount);
    }

    function tokenizePost(uint256 _postNo, uint256 _price, uint256 _supply, string memory contentURI) external payable onlyUser {
        require(msg.value >= fees, "Insufficient amount");
        require(ProfileHandle(profileHandle).ownerOf(tokenIdbyPostNo[_postNo]) == _msgSender(), "You are not the owner of the post");
        require(isPostTokenized[_postNo] == false, "Post already tokenized");
        
        string memory NFTName = string(abi.encodePacked("OasisPostNFT-", Strings.toString(_postNo)));
        PostNFT nftContract = new PostNFT(NFTName, address(this), _msgSender(), _price, _supply, _postNo, contentURI);
        address nftAddress = address(nftContract);
        nft[_postNo] = nftAddress;
        isPostTokenized[_postNo] = true;
    }
    // SOCIAL FUNCTIONS //

    // GAMEFICATION FUNCTIONS //
    function dailyCheckIn(uint256 _tokenId) external onlyUser onlyTokenOwner(_tokenId) {
        // Check if current block timestamp is within the same day as the last check-in
        uint256 currentDay = block.timestamp / 86400; // Divide by seconds in a day
        uint256 lastCheckInDay = lastCheckIn[_msgSender()] / 86400;

        // If timestamps are not on the same day, allow check-in and update timestamp
        if (currentDay != lastCheckInDay) {
            lastCheckIn[_msgSender()] = block.timestamp;
            address tokenBound = ERC6551Registry(tkRegistry).account(tkAccount, chainId, profileHandle, _tokenId, 1);
            ExpToken(expToken).mint(tokenBound, 100 * 10 ** 18);
        } else {
            // Revert transaction if user already checked in today
            revert("Already checked in today");
        }
    }

    function levelUp(uint256 _tokenId) external onlyUser onlyTokenOwner(_tokenId) {
        address tokenBound = ERC6551Registry(tkRegistry).account(tkAccount, chainId, profileHandle, _tokenId, 1);
        uint256 expAmount = ExpToken(expToken).balanceOf(tokenBound);
    
        if (expAmount >= 100) {
            // ERC6551Account(tokenBound).execute(_msgSender(), 0, abi.encodeWithSignature("levelUp(uint256)", _tokenId));
            ExpToken(expToken).burn(tokenBound, 100 * 10 ** 18);
            LevelNFT(levelNFT).mint(tokenBound);
        }
    }
    // SOCIAL FUNCTIONS //

    // Platform Token FUNCTIONS //
    function faucet() external onlyUser() {
        OsToken(osToken).mint(_msgSender(), 1000 * 10 ** 18);
    }
    // Platform Token FUNCTIONS /

    // ADMIN FUNCTIONS //
    function distributeTokenReward(uint256 _amount) external onlyOwner() {
        for(uint256 i = 0; i < postArray.length; i++) {
            uint256 postNo = postArray[i].postNo;
            uint256 tokenId = tokenIdbyPostNo[postNo];
            if(likeCount[postNo] > dislikeCount[postNo]) {
                OsToken(osToken).mint(ProfileHandle(profileHandle).ownerOf(tokenId), _amount * 10 ** 18);
            }
        }
    }

    function withdraw() public onlyOwner {
        payable(_msgSender()).transfer(address(this).balance);
    }
    // ADMIN FUNCTIONS //
}