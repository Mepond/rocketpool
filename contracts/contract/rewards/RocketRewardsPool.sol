pragma solidity 0.6.12;

// SPDX-License-Identifier: GPL-3.0-only

import "../RocketBase.sol";
import "../../interface/rewards/RocketRewardsPoolInterface.sol";


// Holds RPL generated by the network for claiming from stakers (node operators etc)

contract RocketRewardsPool is RocketBase, RocketRewardsPoolInterface {

    // Events
    //event DepositReceived(address indexed from, uint256 amount, uint256 time);

    // Construct
    constructor(address _rocketStorageAddress) RocketBase(_rocketStorageAddress) public {
        version = 1;
    }

}
