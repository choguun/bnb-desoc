import { formatEther, parseEther } from "viem";
import hre from "hardhat";

async function main() {
  const owner = "0xA32B5821eaa4FaaD8B67944fCDed57C937d9B714";
  const chainId = BigInt(97);

  const profileHandle = await hre.viem.deployContract("ProfileHandle", [owner]);
  const oasisHub = await hre.viem.deployContract("OasisHub");
  const token = await hre.viem.deployContract("OsToken", [owner, oasisHub.address, profileHandle.address]);
  const erc6551Account  = await hre.viem.deployContract("ERC6551Account");
  const erc6551Registry = await hre.viem.deployContract("ERC6551Registry");
  const expToken = await hre.viem.deployContract("ExpToken", [owner, oasisHub.address, profileHandle.address]);
  const levelNFT = await hre.viem.deployContract("LevelNFT", [owner, oasisHub.address]);

  await token.write.setHub([oasisHub.address as `0x${string}`]);
  await oasisHub.write.initialize([profileHandle.address, token.address, erc6551Registry.address, erc6551Account.address, chainId, expToken.address, levelNFT.address]);
  
  console.log(
    `exptoken address: ${expToken.address}`
  );
  console.log(
    `levelnft address: ${levelNFT.address}`
  );
  console.log(
    `account address: ${erc6551Account.address}`
  );
  console.log(
    `registry address: ${erc6551Registry.address}`
  );
  console.log(
    `token address: ${token.address}`
  );
  console.log(
    `profile address: ${profileHandle.address}`
  );
  console.log(
    `hub address: ${oasisHub.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
