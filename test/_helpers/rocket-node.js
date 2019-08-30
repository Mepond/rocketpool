// Dependencies
import { getTransactionContractEvents } from '../_lib/utils/general';
import { getValidatorPubkey, getValidatorSignature } from '../_lib/utils/beacon';
import { RocketMinipoolSettings, RocketNodeAPI, RocketNodeContract, RocketPool } from '../_lib/artifacts';
import { mintRpl } from './rocket-pool-token';


// Create a new node contract
export async function createNodeContract({timezone, nodeOperator}) {

    // Create node contract
    let rocketNodeAPI = await RocketNodeAPI.deployed();
    let nodeAddResult = await rocketNodeAPI.add(timezone, {from: nodeOperator});

    // Get & return node contract instance
    let nodeContractAddress = nodeAddResult.logs.filter(log => (log.event == 'NodeAdd'))[0].args.contractAddress;
    let nodeContract = await RocketNodeContract.at(nodeContractAddress);
    return nodeContract;

}


// Create minipools under a node
export async function createNodeMinipools({nodeContract, stakingDurationID, minipoolCount, nodeOperator, owner}) {

    // Get contracts
    let rocketMinipoolSettings = await RocketMinipoolSettings.deployed();
    let rocketPool = await RocketPool.deployed();

    // Get node deposit amount per minipool created
    let miniPoolLaunchAmount = parseInt(await rocketMinipoolSettings.getMinipoolLaunchAmount.call());
    let nodeDepositAmount = Math.floor(miniPoolLaunchAmount / 2);

    // Create minipools and return addresses
    let minipoolAddresses = [];
    for (let mi = 0; mi < minipoolCount; ++mi) {

        // Reserve node deposit
        await nodeContract.depositReserve(stakingDurationID, getValidatorPubkey(), getValidatorSignature(), {from: nodeOperator});

        // Deposit RPL
        let rplRequired = await nodeContract.getDepositReserveRPLRequired.call();
        if (rplRequired > 0) await mintRpl({toAddress: nodeContract.address, rplAmount: rplRequired, fromAddress: owner});

        // Complete deposit to create minipool
        let result = await nodeContract.deposit({from: nodeOperator, value: nodeDepositAmount});

        // Get minipool created events
        let minipoolCreatedEvents = getTransactionContractEvents(result, rocketPool.address, 'PoolCreated', [
            {type: 'address', name: '_address', indexed: true},
            {type: 'bytes32', name: '_durationID', indexed: true},
            {type: 'uint256', name: 'created'},
        ]);

        // Get created minipool addresses
        minipoolCreatedEvents.forEach(event => {
            minipoolAddresses.push(event._address);
        });

    }
    return minipoolAddresses;

}


// Withdraw a node deposit from a minipool
export async function nodeWithdrawMinipoolDeposit({nodeContract, minipoolAddress, nodeOperator}) {
    await nodeContract.withdrawMinipoolDeposit(minipoolAddress, {from: nodeOperator});
}

