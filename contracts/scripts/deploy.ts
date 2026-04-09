import hre from "hardhat";

async function main() {
  console.log("Deploying CyberMusic...");

  const CyberMusic = await hre.ethers.getContractFactory("CyberMusic");
  const contract = await CyberMusic.deploy();

  console.log("Waiting for deployment...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ CyberMusic deployed to: ${address}\n`);
  console.log(`View on Basescan: https://sepolia.basescan.org/address/${address}`);
}

main().catch((error) => {
  console.error("Deploy failed:", error);
  process.exitCode = 1;
});
