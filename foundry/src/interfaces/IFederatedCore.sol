// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IFederatedCore {
    function getReputation(address user) external view returns (int256);
}
