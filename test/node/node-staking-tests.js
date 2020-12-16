import { RocketNodeStaking } from '../_utils/artifacts';
import { takeSnapshot, revertSnapshot } from '../_utils/evm';
import { printTitle } from '../_utils/formatting';
import { shouldRevert } from '../_utils/testing';
import { registerNode, nodeStakeRPL } from '../_helpers/node';
import { setDAOSetting } from '../_helpers/settings';
import { mintRPL, approveRPL } from '../_helpers/tokens';
import { stakeRpl } from './scenario-stake-rpl';
import { withdrawRpl } from './scenario-withdraw-rpl';

export default function() {
    contract('RocketNodeStaking', async (accounts) => {


        // Accounts
        const [
            owner,
            node,
            random,
        ] = accounts;


        // State snapshotting
        let snapshotId;
        beforeEach(async () => { snapshotId = await takeSnapshot(web3); });
        afterEach(async () => { await revertSnapshot(web3, snapshotId); });


        // Setup
        let rocketNodeStaking;
        before(async () => {

            // Load contracts
            rocketNodeStaking = await RocketNodeStaking.deployed();

            // Register node
            await registerNode({from: node});

            // Mint RPL to accounts
            const rplAmount = web3.utils.toWei('100', 'ether');
            await mintRPL(owner, node, rplAmount);
            await mintRPL(owner, random, rplAmount);

        });


        it(printTitle('node operator', 'can stake RPL'), async () => {

            // Set parameters
            const rplAmount = web3.utils.toWei('10', 'ether');

            // Approve transfer & stake RPL
            await approveRPL(rocketNodeStaking.address, rplAmount, {from: node});
            await stakeRpl(rplAmount, {
                from: node,
            });

        });


        it(printTitle('random address', 'cannot stake RPL'), async () => {

            // Set parameters
            const rplAmount = web3.utils.toWei('10', 'ether');

            // Approve transfer & attempt to stake RPL
            await approveRPL(rocketNodeStaking.address, rplAmount, {from: node});
            await shouldRevert(stakeRpl(rplAmount, {
                from: random,
            }), 'Random address staked RPL');

        });


        it(printTitle('node operator', 'can withdraw staked RPL'), async () => {

            // Set parameters
            const rplAmount = web3.utils.toWei('10', 'ether');

            // Remove withdrawal cooldown period
            await setDAOSetting('RewardsClaimIntervalBlocks', 0, {from: owner});

            // Stake RPL
            await nodeStakeRPL(rplAmount, {from: node});

            // Withdraw staked RPL
            await withdrawRpl(rplAmount, {
                from: node,
            });

        });


        it(printTitle('node operator', 'cannot withdraw staked RPL during the cooldown period'), async () => {

            // Set parameters
            const rplAmount = web3.utils.toWei('10', 'ether');

            // Stake RPL
            await nodeStakeRPL(rplAmount, {from: node});

            // Withdraw staked RPL
            await shouldRevert(withdrawRpl(rplAmount, {
                from: node,
            }), 'Withdrew staked RPL during the cooldown period');

        });


        it(printTitle('node operator', 'cannot withdraw more RPL than they have staked'), async () => {

            // Set parameters
            const stakeAmount = web3.utils.toWei('10', 'ether');
            const withdrawAmount = web3.utils.toWei('20', 'ether');

            // Remove withdrawal cooldown period
            await setDAOSetting('RewardsClaimIntervalBlocks', 0, {from: owner});

            // Stake RPL
            await nodeStakeRPL(stakeAmount, {from: node});

            // Withdraw staked RPL
            await shouldRevert(withdrawRpl(withdrawAmount, {
                from: node,
            }), 'Withdrew more RPL than was staked');

        });


        it(printTitle('node operator', 'cannot withdraw RPL leaving the node undercollateralized'));


        it(printTitle('random address', 'cannot withdraw staked RPL'), async () => {

            // Set parameters
            const rplAmount = web3.utils.toWei('10', 'ether');

            // Remove withdrawal cooldown period
            await setDAOSetting('RewardsClaimIntervalBlocks', 0, {from: owner});

            // Stake RPL
            await nodeStakeRPL(rplAmount, {from: node});

            // Withdraw staked RPL
            await shouldRevert(withdrawRpl(rplAmount, {
                from: random,
            }), 'Random address withdrew staked RPL');

        });


    });
}