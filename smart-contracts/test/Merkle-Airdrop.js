const etherlime = require('etherlime-lib');
const MerkleUtils = require('../build/MerkleUtils.json');
const ConvertUtils = require('../build/ConvertUtils.json');
const MerkleAirDrop = require('../build/MerkleAirDrop.json');
const ReMCToken = require('../build/ReMCToken.json');
const ethers = require('ethers');

let deployer;
let MerkleUtilsLib;
let ConvertUtilsLib;
let merkleAirDrop;
let reMCToken;

let minter = accounts[8];
const name = "ReMeLifeCore";
const symbol = "ReMC";

const userAddress = "0xd9995bae12fee327256ffec1e3184d492bd94c31";
const amountToClaim = "5000000000000000000";


let arrayOfHashes;

const tokenDistributor = accounts[1].signer;
const amountToMint = ethers.utils.parseEther("1000");

describe('Example', function () {
	this.timeout(10000);

	before(async () => {
		deployer = new etherlime.EtherlimeGanacheDeployer();

		reMCToken = await deployer.deploy(ReMCToken,
			{},
			name,
			symbol,
			minter.signer.address);

		await reMCToken.from(minter).mint(tokenDistributor.address, amountToMint);
		MerkleUtilsLib = await deployer.deploy(MerkleUtils);
		ConvertUtilsLib = await deployer.deploy(ConvertUtils);
		merkleAirDrop = await deployer.deploy(MerkleAirDrop, { MerkleUtils: MerkleUtilsLib.contractAddress, ConvertUtils: ConvertUtilsLib.contractAddress }, reMCToken.contractAddress, tokenDistributor.address);
		await reMCToken.from(tokenDistributor).approve(merkleAirDrop.contractAddress, amountToMint);

		arrayOfHashes = [];
	});

	it('should set RootHash', async () => {
		let data = "0xd9995bae12fee327256ffec1e3184d492bd94c31:2000000000000000000";

		const hashMsg = ethers.utils.solidityKeccak256(['string'], [data]);
		arrayOfHashes.push(hashMsg);

		await merkleAirDrop.setRoot(hashMsg);

		let root = await merkleAirDrop.rootHash();
		assert.strictEqual(hashMsg, root);
	});

	it('should add second leaf to the root', async () => {
		let newData = "0xd9995bae12fee327256ffec1e3184d492bd94c31:5000000000000000000";

		const hashMsg = ethers.utils.solidityKeccak256(['string'], [newData]);
		arrayOfHashes.push(hashMsg);

		const newRoot = ethers.utils.solidityKeccak256(['bytes', 'bytes'], [arrayOfHashes[0], arrayOfHashes[1]]);

		await merkleAirDrop.setRoot(newRoot);
		let root = await merkleAirDrop.rootHash();
		assert.strictEqual(root, newRoot);

	});

	it('should verify data', async () => {
		let status = await merkleAirDrop.isInState(userAddress,
			amountToClaim,
			[arrayOfHashes[0]], "1");

		assert.ok(status);
	});

	it('should claim tokens', async () => {
		await merkleAirDrop.claim(userAddress,
			amountToClaim,
			[arrayOfHashes[0]], "1");
		const balanceOfClaimer = await reMCToken.balanceOf(userAddress);

		assert(balanceOfClaimer.eq(amountToClaim));
	});

	it('should not send new tokens if tries to claim again', async () => {
		await merkleAirDrop.claim(userAddress,
			amountToClaim,
			[arrayOfHashes[0]], "1");

		const balanceOfClaimer = await reMCToken.balanceOf(userAddress);

		assert(balanceOfClaimer.eq(amountToClaim));
	});

	it('should revert if wrong index', async () => {
		await assert.revert(merkleAirDrop.claim(userAddress,
			amountToClaim,
			[arrayOfHashes[0]], "0"));
	});

	it('should revert if wrong hashes', async () => {
		await assert.revert(merkleAirDrop.claim(userAddress,
			amountToClaim,
			[arrayOfHashes[1]], "1"));
	});

	it('should revert if wrong address', async () => {
		const wrongAddress = accounts[2].signer.address;
		await assert.revert(merkleAirDrop.claim(wrongAddress,
			amountToClaim,
			[arrayOfHashes[0]], "1"));
	});

	it('should revert if wrong amount', async () => {
		const wrongAmount = "6000000000000000000";
		await assert.revert(merkleAirDrop.claim(userAddress,
			wrongAmount,
			[arrayOfHashes[0]], "1"));
	});
});



