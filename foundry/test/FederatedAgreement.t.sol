// // SPDX-License-Identifier: MIT
// pragma solidity >=0.8.25 <0.9.0;

// import { Test } from "forge-std/src/Test.sol";

// import { FederatedAgreement } from "../src/FederatedAgreement.sol";
// import { FheEnabled } from "../util/FheHelper.sol";
// import { Permission, PermissionHelper } from "../util/PermissionHelper.sol";
// import { inEuint128, euint128 } from "@fhenixprotocol/contracts/FHE.sol";
// import { console } from "forge-std/src/console.sol";

// interface IERC20 {
//     function balanceOf(address account) external view returns (uint256);
// }

// /// @dev If this is your first time with Forge, read this tutorial in the Foundry Book:
// /// https://book.getfoundry.sh/forge/writing-tests
// contract FederatedAgreementTest is Test, FheEnabled {
//     FederatedAgreement internal agreement;
//     PermissionHelper private permitHelper;

//     address public owner;
//     uint256 public ownerPrivateKey;

//     uint256 private receiverPrivateKey;
//     address private receiver;

//     Permission private permission;
//     Permission private permissionReceiver;

//     /// @dev A function invoked before each test case is run.
//     function setUp() public virtual {
//         // Required to mock FHE operations - do not forget to call this function
//         // *****************************************************
//         initializeFhe();
//         // *****************************************************

//         // agreement = new FederatedAgreement(0x0, 0, 0, 0);
//     }

//     function testSetPrivateKey() public {
//         bytes memory privateKeyBefore =
//             "731A80530B58A378B9D85EF2CF4A441921C6B5DC420EEE50BF154B53C9CF027EB51D0777DB53B8251639812D0FD3D29B260BA63AC33EC1404EBD95CCB4ED97A0F191888DA5A359F44E3625F9DD044CAFD5E1F270FD02BCD6CD9F34E96C9C9DC4D393F5012DB524342EFF2FD0C728FA3D636B0D077FF45270107156E4D63C72C1";
//         agreement.setPrivateKey(privateKeyBefore);

//         // get private key
//         // string memory privateKeyAfter = agreement.getPrivateKey();

//         // console.log("privateKeyBefore", privateKeyAfter);
//     }
// }
