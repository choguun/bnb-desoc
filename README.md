### How to deploy desoc-contract

* deploy contract
* npx hardhat run scripts/01_deploy_protocol.ts --network testnet

### How to run desoc-web

* run web
* npm i && npm run dev

### Key Features:

* Sign up and sign in with handle (mint ERC721 profile handle) and create a Token Bound Account(ERC6551) for gamification.
* Create posts on-chain with BNB Chain and BNB Greenfield.
* Tipping OsToken(Platform token) to the owner of the post.
* Post owner can tokenize post to NFT(ERC721) and Other users can mint post.
* Social Engagement interaction eg. Like and Dislike.
* Gamification features eg. daily check-in, token reward from post engagement and user can level up from burn EXP token to mint Level NFT.


### Components:

1. Smart Contract on BNB Chain
2. Bucket on BNB Greenfield
3. Web Application


### Smart Contracts:
1. ProfleHandle
* ProfleHandle is ERC721 Contract stands for intended for getting access to the protocol. Users need to mint this with username(sign up) and sign in.

2. OasisHub
* Entry point contract that user needs to interact with like create post, like post, tip, tokenize NFT, and gamification features claim the token reward from calculated like and dislike of post, daily check-in to get exp token and level up to burn exp token and mint level NFT.

3. OsToken
* OsToken is a platform token that users use to tip to other user posts.

4. PostNFT
* PostNFT Contract that is created when users tokenize that post to NFT.

5. ERC6551Account
* ERC6551Account Contract is for Token Bound Account.

6. ERC6551Registry
* ERC6551Registry Contract is for Token Bound Account.

7. ExpToken
* ExpToken Contract is ERC-20 token for level-up profile that will be minted by OasisHub to token bound account that is linked with ProfleHandle.

8. LevelNFT
* LevelNFT Contract stands for reference current level of ProfileHandle each of LevelNFT is equal to 1 level.


### BNB Greenfield:
Store user post content on-chain on BNB Greenfield, this post content will be converted to metadata is contains comments and images.


### How it works:
![How it works](/desoc_howitwork.png "How it works")

### Deployed Contract:
https://testnet.bscscan.com/address/0xeed91088b1824c61bb5dfb44747ccfc8bf55e215
https://testnet.bscscan.com/address/0x7895b4408de0c9047271ae367ecfbf3dccbe7b7b
https://testnet.bscscan.com/address/0x39650e80b5d18fd6283eda32c7811c5d6abe9d92
https://testnet.bscscan.com/address/0x63a31a3ede910f1ab469bf56c07bb6f7455b24b6
https://testnet.bscscan.com/address/0x71ad15d50269f52cd057ff9c9284c4761ec7c958
https://testnet.bscscan.com/address/0xe0dc8f4135d245613ab09de4e11a967f557aa260
https://testnet.bscscan.com/address/0xbab79e3e5749f6ba39c2305e79c67f20d292d509

Demo:
https://bnb-desoc.vercel.app \
Deck:
https://www.canva.com/design/DAF-WQdDkCg/JU1sgg_cyI55SNFs85w2tw/edit