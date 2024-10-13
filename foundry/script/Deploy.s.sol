// // SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { BaseScript } from "./Base.s.sol";
import { Script } from "forge-std/src/Script.sol";
import { FederatedCore } from "../src/FederatedCore.sol";
import { Playground } from "../src/Playground.sol";
import { MockERC20 } from "../src/MockERC20.sol";

/// @dev See the Solidity Scripting tutorial: https://book.getfoundry.sh/tutorials/solidity-scripting
contract Deploy is Script {
  // forge script script/Deploy.s.sol --rpc-url fhenix --broadcast --private-key
  // <PRIVATE_KEY> --skip-simulation --verify --verifier blockscout
  // --verifier-url

  // cast call --rpc-url https://api.helium.fhenix.zone 0x3fEE97a3D244e7bD9aA68a93DeB50969dedb67a7 "owner()(address)"

  // cast send --private-key <PRIVATE_KEY> --rpc-url
  // https://api.helium.fhenix.zone 0x3fEE97a3D244e7bD9aA68a93DeB50969dedb67a7  "proceedNextRoundSandbox()"

  // cast send --private-key <PRIVATE_KEY> --rpc-url
  // https://api.helium.fhenix.zone 0x3fEE97a3D244e7bD9aA68a93DeB50969dedb67a7  "finishAgreementSandbox()"
  function run() public returns (address, address, address) {
    vm.startBroadcast(0x3B584D901D4aEFC30950fd5af50882413E013A60);
    FederatedCore core = new FederatedCore(msg.sender);

    // create agreement

    address agreement = core.createAgreement(msg.sender, 10 ** 18, 10 ** 18, 5, 0, 5);
    vm.stopBroadcast();

    return (agreement, address(core));
  }
}
