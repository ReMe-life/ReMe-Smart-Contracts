# reme-life-contracts

## Contract deployment:

---

### Preset:

-   `npm install`

In `/deployment/deploy.js` set the values of:

-   `INFURA_PROVIDER` - Infura api key. [https://infura.io/](https://infura.io/) - registration with email is required to receive API keys
-   `ETHERSCAN_API_KEY` - Etherscan api key. [https://etherscan.io/](https://etherscan.io/) - registration with email is required to receive API keys
-   `TOKEN_DISTRIBUTOR_ADDRESS` - The address where the `PREMINTED_AMOUNT` will be initially minted

### Deployment:

-   `etherlime compile --solcVersion 0.6.0`
-   `etherlime deploy --network /network name (e.g. mainnet)/ --secret /deployer's wallet private key/`

---
