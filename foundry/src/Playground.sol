// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FHE, inEuint128, euint256, euint128 } from "@fhenixprotocol/contracts/FHE.sol";

contract Playground {
    euint128 public encHighPrivateKey;
    euint128 public encLowPrivateKey;
    bytes public remainderPrivateKey;

    // ************************************
    // ************ PUBLICs ***************
    // ************************************
    function setPrivateKey(bytes calldata privateKey) public {
        // extract first 16 bytes of private key
        bytes16 highPrivateKey = bytes16(privateKey[:16]);

        // extract last 16 bytes of private key
        bytes16 lowPrivateKey = bytes16(privateKey[privateKey.length - 16:]);

        // extract remainder of private key
        remainderPrivateKey = privateKey[16:privateKey.length - 16];

        // encrypt high private key
        encHighPrivateKey = FHE.asEuint128(uint128(highPrivateKey));
        encLowPrivateKey = FHE.asEuint128(uint128(lowPrivateKey));
    }
}
