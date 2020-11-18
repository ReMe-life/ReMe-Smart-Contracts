const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const Utils = require("./Utils");
const ReMCToken = require("../build/ReMCToken");
const TokenTimelock = require("../build/TokenTimelock");

describe("TokenTimelock", function () {
    this.timeout(10000);

    const alice = accounts[1].signer;
    const bob = accounts[2].signer;
    const carlos = accounts[3].signer;

    const aliceAmount = ethers.utils.parseEther("5");
    const bobAmount = ethers.utils.parseEther("6");
    const carlosAmount = ethers.utils.parseEther("7");

    const totalAmount = aliceAmount.add(bobAmount).add(carlosAmount);

    const owner = accounts[9];
    const minter = accounts[8];
    let reMCTokenInstance;

    const name = "ReMeLifeCore";
    const symbol = "ReMC";

    const maxWithdrawDeposits = 50;

    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
        reMCTokenInstance = await deployer.deploy(
            ReMCToken,
            {},
            name,
            symbol,
            minter.signer.address
        );
        tokenTimelockInstance = await deployer.deploy(
            TokenTimelock,
            {},
            reMCTokenInstance.contractAddress,
            maxWithdrawDeposits
        );

        await reMCTokenInstance
            .from(minter)
            .mint(owner.signer.address, totalAmount);

        await reMCTokenInstance
            .from(owner)
            .approve(tokenTimelockInstance.contractAddress, totalAmount);
    });

    it("should deploy token time lock contract", async () => {
        assert.isAddress(
            tokenTimelockInstance.contractAddress,
            "The contract was not deployed"
        );
        const tokenAddress = await tokenTimelockInstance.token();
        assert.equal(tokenAddress, reMCTokenInstance.contractAddress);
    });

    describe("Issue Deposit", function () {
        it("should issue a deposit", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await tokenTimelockInstance.createDeposit(
                alice.address,
                aliceAmount,
                timestampAfterNDays
            );

            const aliceDeposit = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );

            assert(aliceDeposit[0].amount.eq(aliceAmount));
            assert(aliceDeposit[0].releaseTime.eq(timestampAfterNDays));
        });

        it("should revert if address = 0x0", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await assert.revert(
                tokenTimelockInstance.createDeposit(
                    ethers.constants.AddressZero,
                    aliceAmount,
                    timestampAfterNDays
                )
            );
        });

        it("should revert if amount = 0", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await assert.revert(
                tokenTimelockInstance.createDeposit(
                    alice.address,
                    ethers.constants.Zero,
                    timestampAfterNDays
                )
            );
        });

        it("should revert end date is not in the furute", async () => {
            let blockInfo = await deployer.provider.getBlock();

            await assert.revert(
                tokenTimelockInstance.createDeposit(
                    alice.address,
                    aliceAmount,
                    blockInfo.timestamp
                )
            );
        });

        it("should issue multiple deposits", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await tokenTimelockInstance.createMultipleDeposits(
                [alice.address, bob.address, carlos.address],
                [aliceAmount, bobAmount, carlosAmount],
                [timestampAfterNDays, timestampAfterNDays, timestampAfterNDays]
            );

            const aliceDeposit = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );
            const bobDeposit = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                bob.address
            );
            const carlosDeposit = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                carlos.address
            );
            assert(aliceDeposit[0].amount.eq(aliceAmount));
            assert(bobDeposit[0].amount.eq(bobAmount));
            assert(carlosDeposit[0].amount.eq(carlosAmount));

            assert(aliceDeposit[0].releaseTime.eq(timestampAfterNDays));
            assert(bobDeposit[0].releaseTime.eq(timestampAfterNDays));
            assert(carlosDeposit[0].releaseTime.eq(timestampAfterNDays));
        });

        it("should emit DepositIssued event", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            const expectedEvent = "DepositIssued";
            await assert.emit(
                tokenTimelockInstance.createMultipleDeposits(
                    [alice.address],
                    [aliceAmount],
                    [timestampAfterNDays]
                ),
                expectedEvent
            );
        });

        it("should issue multiple deposits for one user", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await tokenTimelockInstance.createMultipleDeposits(
                [alice.address, alice.address],
                [aliceAmount, aliceAmount.mul(2)],
                [timestampAfterNDays, timestampAfterNDays + 5]
            );

            const aliceDeposit = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );

            assert(aliceDeposit[0].amount.eq(aliceAmount));
            assert(aliceDeposit[1].amount.eq(aliceAmount.mul(2)));

            assert(aliceDeposit[0].releaseTime.eq(timestampAfterNDays));
            assert(aliceDeposit[1].releaseTime.eq(timestampAfterNDays + 5));
        });

        it("should revert called from user without tokens", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await assert.revert(
                tokenTimelockInstance
                    .from(alice)
                    .createMultipleDeposits(
                        [alice.address, bob.address],
                        [aliceAmount, bobAmount],
                        [timestampAfterNDays, timestampAfterNDays]
                    )
            );
        });

        it("should revert if addresses mismatch amounts", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await assert.revert(
                tokenTimelockInstance.createMultipleDeposits(
                    [alice.address, bob.address],
                    [aliceAmount, bobAmount, carlosAmount],
                    [timestampAfterNDays, timestampAfterNDays]
                )
            );
        });

        it("should revert if addresses mismatch end dates", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await assert.revert(
                tokenTimelockInstance.createMultipleDeposits(
                    [alice.address, bob.address],
                    [aliceAmount, bobAmount],
                    [timestampAfterNDays]
                )
            );
        });

        it("should revert if end dates mismatch amounts", async () => {
            const days = 7;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await assert.revert(
                tokenTimelockInstance.createMultipleDeposits(
                    [alice.address, bob.address],
                    [aliceAmount, bobAmount],
                    [
                        timestampAfterNDays,
                        timestampAfterNDays,
                        timestampAfterNDays,
                    ]
                )
            );
        });

        it("should revert if end date is not in the future", async () => {
            let blockInfo = await deployer.provider.getBlock();
            await assert.revert(
                tokenTimelockInstance
                    .from(alice)
                    .createMultipleDeposits(
                        [alice.address, bob.address],
                        [aliceAmount, bobAmount],
                        [blockInfo.timestamp, blockInfo.timestamp]
                    )
            );
        });
    });

    describe("Release Deposit", function () {
        let timestampAfterNDays;

        beforeEach(async () => {
            const days = 7;
            timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );
            await tokenTimelockInstance.createMultipleDeposits(
                [alice.address, bob.address, carlos.address],
                [aliceAmount, bobAmount, carlosAmount],
                [timestampAfterNDays, timestampAfterNDays, timestampAfterNDays]
            );
        });

        it("should release a deposit", async () => {
            let aliceBalance = await reMCTokenInstance.balanceOf(alice.address);
            assert(aliceBalance.eq(0));
            const index = 0;
            utils.timeTravel(deployer.provider, timestampAfterNDays);
            await tokenTimelockInstance.from(alice).releaseDeposit(index);

            const result = await tokenTimelockInstance.beneficiaries(
                alice.address,
                index
            );
            assert.ok(result.isClaimed);

            aliceBalance = await reMCTokenInstance.balanceOf(alice.address);
            assert(aliceBalance.eq(aliceAmount));
        });

        it("should emit DepositReleased event", async () => {
            const index = 0;
            utils.timeTravel(deployer.provider, timestampAfterNDays);

            const expectedEvent = "DepositReleased";
            await assert.emit(
                tokenTimelockInstance.from(alice).releaseDeposit(index),
                expectedEvent
            );
        });

        it("should revert if one tries to claim same deposit second time", async () => {
            const index = 0;
            utils.timeTravel(deployer.provider, timestampAfterNDays);
            await tokenTimelockInstance.from(alice).releaseDeposit(index);

            await assert.revert(
                tokenTimelockInstance.from(alice).releaseDeposit(index)
            );
        });

        it("should revert if one tries to claim before end date", async () => {
            const index = 0;
            await assert.revert(
                tokenTimelockInstance.from(alice).releaseDeposit(index)
            );
        });

        it("should revert if one tries to claim non existing deposit", async () => {
            const index = 1;
            utils.timeTravel(deployer.provider, timestampAfterNDays);
            await assert.revert(
                tokenTimelockInstance.from(alice).releaseDeposit(index)
            );
        });
    });

    describe("Release Multiple Deposits", function () {
        this.timeout(25000);

        let timestampAfterNDays;
        let depositCount;

        beforeEach(async () => {
            const days = 7;
            timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );

            depositCount = 50;

            let recipients = [];
            let amounts = [];
            let releaseDates = [];

            for (let i = 0; i < depositCount; i++) {
                recipients.push(alice.address);
                amounts.push(aliceAmount);
                releaseDates.push(timestampAfterNDays);
            }

            const totalAmount = aliceAmount.mul(depositCount);

            await reMCTokenInstance
                .from(minter)
                .mint(owner.signer.address, totalAmount);

            await reMCTokenInstance
                .from(owner)
                .approve(tokenTimelockInstance.contractAddress, totalAmount);

            await tokenTimelockInstance.createMultipleDeposits(
                recipients,
                amounts,
                releaseDates
            );
        });

        it("should release multiple deposits", async () => {
            const startIndex = 0;
            const endIndex = 49;
            utils.timeTravel(deployer.provider, timestampAfterNDays);

            await tokenTimelockInstance
                .from(alice)
                .releaseMultipleDeposits(startIndex, endIndex);

            const aliceTokenBalance = await reMCTokenInstance.balanceOf(
                alice.address
            );
            assert(aliceTokenBalance.eq(aliceAmount.mul(depositCount)));

            const depositInfo = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );

            for (let i = 0; i < depositInfo.length; i++) {
                assert.ok(depositInfo[i].isClaimed);
            }
        });

        it("should emit MultipleDepositsReleased event", async () => {
            const startIndex = 0;
            const endIndex = 49;

            utils.timeTravel(deployer.provider, timestampAfterNDays);

            const expectedEvent = "MultipleDepositsReleased";
            await assert.emit(
                tokenTimelockInstance
                    .from(alice)
                    .releaseMultipleDeposits(startIndex, endIndex),
                expectedEvent
            );
        });

        it("should release multiple deposits if already claimed some", async () => {
            const startIndex = 0;
            const endIndex = 49;

            utils.timeTravel(deployer.provider, timestampAfterNDays);

            const index = 34;
            await tokenTimelockInstance.from(alice).releaseDeposit(index);

            const depositInfo = await tokenTimelockInstance.beneficiaries(
                alice.address,
                index
            );

            assert.ok(depositInfo.isClaimed);

            let aliceTokenBalance = await reMCTokenInstance.balanceOf(
                alice.address
            );

            assert(aliceTokenBalance.eq(aliceAmount));

            await tokenTimelockInstance
                .from(alice)
                .releaseMultipleDeposits(startIndex, endIndex);

            aliceTokenBalance = await reMCTokenInstance.balanceOf(
                alice.address
            );
            assert(aliceTokenBalance.eq(aliceAmount.mul(depositCount)));
        });

        it("should revert if end date is out of range", async () => {
            const startIndex = 10;
            const endIndex = 51;

            utils.timeTravel(deployer.provider, timestampAfterNDays);

            await assert.revert(
                tokenTimelockInstance
                    .from(alice)
                    .releaseMultipleDeposits(startIndex, endIndex)
            );
        });

        it("should revert if range is bigger than the max withdraw limit", async () => {
            const startIndex = 0;
            const endIndex = 51;

            utils.timeTravel(deployer.provider, timestampAfterNDays);

            await assert.revert(
                tokenTimelockInstance
                    .from(alice)
                    .releaseMultipleDeposits(startIndex, endIndex)
            );
        });

        it("should revert if end index is less than start index", async () => {
            const startIndex = 10;
            const endIndex = 5;

            utils.timeTravel(deployer.provider, timestampAfterNDays);

            await assert.revert(
                tokenTimelockInstance
                    .from(alice)
                    .releaseMultipleDeposits(startIndex, endIndex)
            );
        });
    });

    describe("Test scenario", function () {
        this.timeout(20000);

        it("should execute a test scenario", async () => {
            // create first portion of deposits
            const days = 365;
            let timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );

            depositCount = 5;

            let recipients = [];
            let amounts = [];
            let releaseDates = [];

            for (let i = 0; i < depositCount; i++) {
                recipients.push(alice.address);
                amounts.push(aliceAmount);
                releaseDates.push(timestampAfterNDays);
            }

            let totalAmount = aliceAmount.mul(depositCount);

            await reMCTokenInstance
                .from(minter)
                .mint(owner.signer.address, totalAmount);

            await reMCTokenInstance
                .from(owner)
                .approve(tokenTimelockInstance.contractAddress, totalAmount);

            await tokenTimelockInstance.createMultipleDeposits(
                recipients,
                amounts,
                releaseDates
            );

            // withdraw first portion of deposits
            let startIndex = 0;
            let aliceDepositCount = await tokenTimelockInstance.getBeneficiaryDepositsCount(
                alice.address
            );

            // sub 1 to get the index
            let endIndex = aliceDepositCount.sub(1);
            utils.timeTravel(deployer.provider, timestampAfterNDays);

            let depositInfo = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );

            for (let i = 0; i < depositInfo.length; i++) {
                assert.ok(!depositInfo[i].isClaimed);
            }

            await tokenTimelockInstance
                .from(alice)
                .releaseMultipleDeposits(startIndex, endIndex);

            let aliceTokenBalance = await reMCTokenInstance.balanceOf(
                alice.address
            );

            let expectedBalance = aliceAmount.mul(depositCount);
            assert(aliceTokenBalance.eq(expectedBalance));

            depositInfo = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );

            for (let i = 0; i < depositInfo.length; i++) {
                assert.ok(depositInfo[i].isClaimed);
            }

            // create second portion of deposits
            timestampAfterNDays = await Utils.getTimestampForNdays(
                deployer.provider,
                days
            );

            depositCount = 10;

            recipients = [];
            amounts = [];
            releaseDates = [];

            for (let i = 0; i < depositCount; i++) {
                recipients.push(alice.address);
                amounts.push(aliceAmount);
                releaseDates.push(timestampAfterNDays);
            }

            totalAmount = aliceAmount.mul(depositCount);

            await reMCTokenInstance
                .from(minter)
                .mint(owner.signer.address, totalAmount);

            await reMCTokenInstance
                .from(owner)
                .approve(tokenTimelockInstance.contractAddress, totalAmount);

            await tokenTimelockInstance.createMultipleDeposits(
                recipients,
                amounts,
                releaseDates
            );

            // withdraw second portion of deposits
            startIndex = 5;
            aliceDepositCount = await tokenTimelockInstance.getBeneficiaryDepositsCount(
                alice.address
            );

            // sub 1 to get the index
            endIndex = aliceDepositCount.sub(1);
            utils.timeTravel(deployer.provider, timestampAfterNDays);

            depositInfo = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );

            for (let i = startIndex; i < aliceDepositCount; i++) {
                assert.ok(!depositInfo[i].isClaimed);
            }

            await tokenTimelockInstance
                .from(alice)
                .releaseMultipleDeposits(startIndex, endIndex);

            aliceTokenBalance = await reMCTokenInstance.balanceOf(
                alice.address
            );
            expectedBalance = expectedBalance.add(
                aliceAmount.mul(depositCount)
            );
            assert(aliceTokenBalance.eq(expectedBalance));

            depositInfo = await tokenTimelockInstance.getAllBeneficiaryDeposits(
                alice.address
            );

            for (let i = 0; i < depositInfo.length; i++) {
                assert.ok(depositInfo[i].isClaimed);
            }
        });
    });
});
