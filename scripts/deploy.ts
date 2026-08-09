import { ethers } from "hardhat";

async function main() {
  console.log("=================================================");
  console.log(" DEPLOYING EXAM GROUP CONTRACT TO SEPOLIA TESTNET");
  console.log("=================================================");

  // Shared Semaphore v4 Registry contract live on Sepolia:
  const SEPOLIA_SEMAPHORE_ADDRESS = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

  console.log(`Using Semaphore Registry: ${SEPOLIA_SEMAPHORE_ADDRESS}`);

  const ExamGroupFactory = await ethers.getContractFactory("ExamGroup");
  const examGroup = await ExamGroupFactory.deploy(SEPOLIA_SEMAPHORE_ADDRESS);

  await examGroup.waitForDeployment();

  const contractAddress = await examGroup.getAddress();
  const groupId = await examGroup.groupId();

  console.log("\nDeployment Successful!");
  console.log(`ExamGroup Contract Address: ${contractAddress}`);
  console.log(`Created Semaphore Group ID: ${groupId.toString()}`);
  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.env.EXIT_CODE = "1";
});
