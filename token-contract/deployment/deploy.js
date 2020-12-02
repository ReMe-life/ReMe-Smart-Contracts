const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const ReMCToken = require("../build/ReMCToken.json");
const TokenTimelock = require("../build/TokenTimelock.json");

const MerkleUtils = require('../build/MerkleUtils.json');
const ConvertUtils = require('../build/ConvertUtils.json');
const MerkleAirDrop = require('../build/MerkleAirDrop.json');

const INFURA_PROVIDER = "148dda379bdd4346ae1ad2e9a159249d";
const ETHERSCAN_API_KEY = "J531BRU4FNGMNCD693FT6YS9TAM9TWS6QG";
const ETHERSCAN = "etherscan";

const TOKEN_DISTRIBUTOR_ADDRESS = "0x39F00e926DeE09De7f44646a640e83fd912Bec17";
const PREMINTED_AMOUNT = ethers.utils.parseEther("1000000000")

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
        TOKEN_DISTRIBUTOR_ADDRESS,
        PREMINTED_AMOUNT
    );

    const tokenTimelockInstance = await deployer.deployAndVerify(
        ETHERSCAN,
        TokenTimelock,
        {},
        reMCTokenInstance.contractAddress,
        maxWithdrawDeposits
    );

    const MerkleUtilsLib = await deployer.deploy(MerkleUtils);
    const ConvertUtilsLib = await deployer.deploy(ConvertUtils);
    const MerkleAirDropDeployed = await deployer.deployAndVerify(
        ETHERSCAN,
        MerkleAirDrop, {
        MerkleUtils: MerkleUtilsLib.contractAddress,
        ConvertUtils: ConvertUtilsLib.contractAddress
    }, reMCTokenInstance.contractAddress, TOKEN_DISTRIBUTOR_ADDRESS);

};

module.exports = {
    deploy,
};