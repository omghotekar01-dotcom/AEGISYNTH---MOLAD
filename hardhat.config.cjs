require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');
require('dotenv').config();
const pk = process.env.MONAD_TESTNET_PRIVATE_KEY;
module.exports = {
  solidity: {version: '0.8.26', settings: {optimizer: {enabled: true, runs: 200}, evmVersion: 'cancun'}},
  networks: {
    hardhat: {chainId: 31337},
    monadTestnet: {
      url: process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz',
      chainId: 10143,
      accounts: pk ? [pk] : []
    }
  }
};
