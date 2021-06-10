# reme-life-contracts

## Overall steps for setup ReMe app

-   (Optional) Create a multisig wallet or set up an admin wallet.
-   Create a token distributor wallet which will hold the preminted amount and will distribute the token through MerkleAirDrop later on.
-   Deploy [Smart Contracts](https://github.com/ReMe-life/ReMe-Smart-Contracts/tree/master/smart-contracts). As a result we will have the addresses of ReMCToken, TokenTimelock and MerkleAirDrop needed for configuring the following deployments.
-   Deploy [Merkle-Tree-Distribution](https://github.com/ReMe-life/ReMe-Merkle-Tree-Distribution) or use the existing one deployed [here](https://console.cloud.google.com/sql/instances/merkle-tree-hashes/databases?project=reme-wallet-test) by resetting the database (delete and create again with the same name) and setting the new ENV variables for mainnet.
-   Deploy [Wallet-Api](https://github.com/ReMe-life/ReMe-Wallet-API/tree/staging)
-   Deploy [Wallet](https://github.com/ReMe-life/ReMe-Wallet/tree/staging)

---

## Contract deployment:

---

### Preset:

-   `npm install`

in `/deployment/deploy.js` set the values of:

-   `INFURA_PROVIDER` - Infura api key. [https://infura.io/](https://infura.io/)
-   `ETHERSCAN_API_KEY` - Etherscan api key. [https://etherscan.io/](https://etherscan.io/)
-   `TOKEN_DISTRIBUTOR_ADDRESS` - the address where the `PREMINTED_AMOUNT` will be initially minted

### Deployment:

-   `etherlime compile --solcVersion 0.6.0`
-   `etherlime deploy --network /network name (e.g. mainnet)/ --secret /deployer's wallet private key/`

---
