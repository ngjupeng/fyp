// // SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.24 <0.9.0;

import { BaseScript } from "./Base.s.sol";
import { Script } from "forge-std/src/Script.sol";
import { FederatedCore } from "../src/FederatedCore.sol";
import { Playground } from "../src/Playground.sol";
import { MockERC20 } from "../src/MockERC20.sol";

/// @dev See the Solidity Scripting tutorial: https://book.getfoundry.sh/tutorials/solidity-scripting
contract Deploy is Script {
  // forge script script/Deploy.s.sol --rpc-url fhenix --broadcast --private-key
  // <PRIVATE_KEY> --skip-simulation --verify --verifier blockscout
  // --verifier-url https://explorer.helium.fhenix.zone/api/

  // cast call --rpc-url https://api.helium.fhenix.zone 0x6aE373532f9AC843aB9Acf3Ded60DF90220738be "owner()(address)"

  // cast send --private-key <PRIVATE_KEY> --rpc-url
  // https://api.helium.fhenix.zone 0x3fEE97a3D244e7bD9aA68a93DeB50969dedb67a7  "proceedNextRoundSandbox()"

  // cast send --private-key <PRIVATE_KEY> --rpc-url
  // https://api.helium.fhenix.zone 0x3fEE97a3D244e7bD9aA68a93DeB50969dedb67a7  "finishAgreementSandbox()"
  function run() public payable returns (address) {
    vm.startBroadcast(0x35340673E33eF796B9a2d00dB8B6A549205aabe4);
    FederatedCore core = new FederatedCore(msg.sender);

    vm.stopBroadcast();

    return (address(core));
  }
}
