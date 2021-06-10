const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const ReMCToken = require("../build/ReMCToken.json");
const TokenTimelock = require("../build/TokenTimelock.json");

const MerkleUtils = require('../build/MerkleUtils.json');
const ConvertUtils = require('../build/ConvertUtils.json');
const MerkleAirDrop = require('../build/MerkleAirDrop.json');

// Important! We have to use a client infura api key and etherscan api key
const INFURA_PROVIDER = "";
const ETHERSCAN_API_KEY = "";
const ETHERSCAN = "etherscan";

// Important! We have to set the client multisig wallet
const TOKEN_DISTRIBUTOR_ADDRESS = "";
const PREMINTED_AMOUNT = ethers.utils.parseEther("1000000000");

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