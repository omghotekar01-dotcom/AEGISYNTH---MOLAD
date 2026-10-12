const hre = require('hardhat');
async function main() {
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error('Refusing non-Monad-Testnet deployment');
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error('Set MONAD_TESTNET_PRIVATE_KEY securely in ignored .env');
  // Demo defaults put roles under the deployer. Change to distinct funded wallets before real use.
  const factory = await hre.ethers.getContractFactory('AegisVault');
  const vault = await factory.deploy(deployer.address, deployer.address);
  const tx = vault.deploymentTransaction();
  const receipt = await tx.wait(1);
  if (!receipt || receipt.status !== 1) throw new Error('Deployment receipt did not confirm success');
  const address = await vault.getAddress();
  if ((await hre.ethers.provider.getCode(address)) === '0x') throw new Error('No bytecode at deployed address');
  console.log(JSON.stringify({chainId: Number(network.chainId), contract: address, deployer: deployer.address, txHash: tx.hash, blockNumber: receipt.blockNumber, explorer: `https://testnet.monadvision.com/address/${address}`},null,2));
}
main().catch(err=>{console.error(err.message);process.exitCode=1});
