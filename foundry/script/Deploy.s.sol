// // SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";
import { Script } from "forge-std/src/Script.sol";
import { FederatedCore } from "../src/FederatedCore.sol";
import { Playground } from "../src/Playground.sol";

/// @dev See the Solidity Scripting tutorial: https://book.getfoundry.sh/tutorials/solidity-scripting
contract Deploy is Script {
    function run() public returns (Playground) {
        vm.startBroadcast(0x3B584D901D4aEFC30950fd5af50882413E013A60);
        return new Playground();
        vm.stopBroadcast();
    }
}
