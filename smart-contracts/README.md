# reme-life-contracts

## Contract deployment:

---

### Preset:

in `/deployment/deploy.js` set the values of:

-   `INFURA_PROVIDER` - Infura api key. [https://infura.io/](https://infura.io/)
-   `ETHERSCAN_API_KEY` - Etherscan api key. [https://etherscan.io/](https://etherscan.io/)
-   `TOKEN_DISTRIBUTOR_ADDRESS` - the address where the `PREMINTED_AMOUNT` will be initially minted

### Deployment:

-   `etherlime compile --solcVersion 0.6.0`
-   `etherlime deploy --network /network name (e.g. mainnet)/ --secret /deployer's wallet private key/`

---
