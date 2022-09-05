const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
  // 您在上一个模块中部署的白名单合约的地址
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  // 我们可以从中提取 Crypto Dev NFT 元数据的 URL
  const metadataURL = METADATA_URL;
  /*
  ethers.js 中的 ContractFactory 是用于部署新智能合约的抽象，
  因此这里的 cryptoDevsContract 是我们的 CryptoDevs 合约实例的工厂。
  */
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

  // 部署合约
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );

  // 打印部署合约的地址
  console.log(
    "Crypto Devs Contract Address:",
    deployedCryptoDevsContract.address
  );
}

// 调用main函数，如果有错误就catch
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });