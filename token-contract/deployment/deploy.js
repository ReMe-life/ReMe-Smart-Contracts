const etherlime = require("etherlime-lib");
const ReMCToken = require("../build/ReMCToken.json");
const TokenTimelock = require("../build/TokenTimelock.json");

const INFURA_PROVIDER = "148dda379bdd4346ae1ad2e9a159249d";
const ETHERSCAN_API_KEY = "J531BRU4FNGMNCD693FT6YS9TAM9TWS6QG";
const MINTER_ADDRESS = "0x4555A429Df5Cc32efa46BCb1412a3CD7Bf14b381";
const ETHERSCAN = "etherscan";

const name = "ReMeLifeCore";
const symbol = "ReMC";
const maxWithdrawDeposits = 50;

const deploy = async (network, secret) => {
    const deployer = new etherlime.InfuraPrivateKeyDeployer(
        secret,
        network,
        INFURA_PROVIDER
    );

    deployer.setVerifierApiKey(ETHERSCAN_API_KEY);

    const reMCTokenInstance = await deployer.deployAndVerify(
        ETHERSCAN,
        ReMCToken,
        {},
        name,
        symbol,
        MINTER_ADDRESS
    );

    const tokenTimelockInstance = await deployer.deployAndVerify(
        ETHERSCAN,
        TokenTimelock,
        {},
        reMCTokenInstance.contractAddress,
        maxWithdrawDeposits
    );
};

module.exports = {
    deploy,
};
