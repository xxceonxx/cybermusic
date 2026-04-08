import hre from "hardhat";

async function main() {
  const CyberMusic = await hre.ethers.getContractFactory("CyberMusic");
  const contract = await CyberMusic.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`CyberMusic deployed to: ${address}`);

  if (hre.network.name !== "hardhat") {
    console.log("Waiting for confirmations...");
    await contract.deploymentTransaction()?.wait(5);

    console.log("Verifying on Basescan...");
    await hre.run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("Verified!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
