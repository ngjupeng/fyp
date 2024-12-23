// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.19;

// import { FHE, inEuint128, euint256, euint128 } from "@fhenixprotocol/contracts/FHE.sol";
// import { Permissioned, Permission } from "@fhenixprotocol/contracts/access/Permissioned.sol";
// import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
// import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import { IFederatedAgreementTypes } from "./interfaces/IFederatedAgreementTypes.sol";
// import { IFederatedCore } from "./interfaces/IFederatedCore.sol";

// contract TestDecription {
//   function setPrivateKey(
//     inEuint128 calldata first30,
//     inEuint128 calldata last30,
//     string calldata middlePart
//   ) public onlyOwner initializer {
//     // // encrypt high private key
//     encHighPrivateKey = first30;
//     encLowPrivateKey = last30;
//     remainderPrivateKey = middlePart;
//   }

//   function getPrivateKey() public returns (uint256, uint256, string memory) {
//     // check is participant
//     _requiredParticipant(msg.sender);
//     // uint128 highPrivateKey = FHE.decrypt(FHE.asEuint128(encHighPrivateKey));
//     // uint128 lowPrivateKey = FHE.decrypt(FHE.asEuint128(encLowPrivateKey));
//     // return (highPrivateKey, lowPrivateKey, remainderPrivateKey);
//     return (encHighPrivateKey, encLowPrivateKey, remainderPrivateKey);
//   }
// }
