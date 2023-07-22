const hre = require("hardhat");

async function main() {
const TimeLock = await hre.ethers.getContractFactory("TimeLock");
  const timeLock = await TimeLock.deploy(
    // gas limit
    { gasLimit: 1000000 } // Change this value according to your deployment
  );
  console.log("TimeLock deployed to:", await timeLock.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });