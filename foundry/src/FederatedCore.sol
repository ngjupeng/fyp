// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FederatedAgreement } from "./FederatedAgreement.sol";
import { IFederatedCore } from "./interfaces/IFederatedCore.sol";

contract FederatedCore is IFederatedCore {
    mapping(address => int256) private reputations;

    // ************************************
    // ************ PUBLICs ***************
    // ************************************

    function createAgreement(
        address _owner,
        address _tokenAddress,
        uint256 _totalRewards,
        uint256 _collateralAmount,
        uint256 _maximumParticipants,
        uint256 _reputationThreshold
    )
        public
        returns (address)
    {
        FederatedAgreement agreement = new FederatedAgreement(
            _owner,
            _tokenAddress,
            _totalRewards,
            _collateralAmount,
            _maximumParticipants,
            _reputationThreshold,
            address(this)
        );

        return address(agreement);
    }

    function getReputation(address user) public view returns (int256) {
        return reputations[user];
    }
}
