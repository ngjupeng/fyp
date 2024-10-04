// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IFederatedCore {
    function getReputation(address user) external view returns (int256);

    function addReputation(address user) external;

    function subtractReputation(address user) external;

    // ************************************
    // ************ EVENTS ****************
    // ************************************
    event ReputationAdded(address indexed user);

    event ReputationSubtracted(address indexed user);

    event AgreementCreated(
        address indexed agreement,
        address indexed owner,
        address indexed tokenAddress,
        uint256 totalRewards,
        uint256 collateralAmount,
        uint256 maximumParticipants,
        uint256 reputationThreshold
    );

    // ************************************
    // ************ ERRORs ****************
    // ************************************
    error TransferFailed();
    error NotAgreement();
}
