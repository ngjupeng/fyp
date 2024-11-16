// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { Test } from "forge-std/src/Test.sol";
import { FederatedCore } from "../src/FederatedCore.sol";
import { FederatedAgreement } from "../src/FederatedAgreement.sol";
import { console } from "forge-std/src/console.sol";
import { IFederatedCore } from "../src/interfaces/IFederatedCore.sol";
import { IFederatedAgreementTypes } from "../src/interfaces/IFederatedAgreementTypes.sol";

contract FederatedCoreTest is Test {
  FederatedCore internal core;

  address public owner;
  uint256 public ownerPrivateKey;

  address[] public participants;
  uint256[] public participantKeys;

  // Test constants
  uint256 constant TOTAL_REWARDS = 100 ether;
  uint256 constant COLLATERAL_AMOUNT = 1 ether;
  uint256 constant MAXIMUM_PARTICIPANTS = 10;
  uint256 constant REPUTATION_THRESHOLD = 100;
  uint256 constant MAXIMUM_ROUNDS = 5;
  uint256 constant NUM_PARTICIPANTS = 5;

  function setUp() public {
    ownerPrivateKey = 0x1;
    owner = vm.addr(ownerPrivateKey);

    for (uint i = 0; i < NUM_PARTICIPANTS; i++) {
      uint256 privKey = 0x2 + i;
      address participant = vm.addr(privKey);
      participants.push(participant);
      participantKeys.push(privKey);
    }

    core = new FederatedCore(owner);
  }

  function test_CreateAgreement() public {
    vm.startPrank(owner);
    vm.deal(owner, TOTAL_REWARDS + COLLATERAL_AMOUNT);

    address[] memory whitelistedAddresses = new address[](0);

    uint256 nonce = vm.getNonce(address(core));
    address expectedAgreement = computeCreateAddress(address(core), nonce);

    vm.expectEmit(true, true, false, true, address(core));
    emit IFederatedCore.AgreementCreated(
      expectedAgreement,
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD
    );

    address agreement = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    assertEq(agreement, expectedAgreement);
    vm.stopPrank();
  }

  function test_AgreementLifecycleEvents() public {
    // Create agreement
    vm.startPrank(owner);
    vm.deal(owner, TOTAL_REWARDS + COLLATERAL_AMOUNT);

    address[] memory whitelistedAddresses = new address[](0);
    address agreement = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );
    vm.stopPrank();

    // Test round progression event
    vm.startPrank(agreement);

    vm.expectEmit(true, true, false, true, address(core));
    emit IFederatedCore.AgreementProceedNextRound(agreement, 1);
    core.emitAgreementProceedNextRound(agreement, 1);

    // Test agreement finished event
    vm.expectEmit(true, true, false, true, address(core));
    emit IFederatedCore.AgreementFinished(agreement, MAXIMUM_ROUNDS);
    core.emitAgreementFinished(agreement, MAXIMUM_ROUNDS);

    vm.stopPrank();
  }

  function testFail_UnauthorizedReputationChange() public {
    address user = participants[0];
    core.addReputation(user);
  }

  function testFail_CreateAgreementWithInsufficientFunds() public {
    vm.startPrank(owner);
    vm.deal(owner, COLLATERAL_AMOUNT);

    address[] memory whitelistedAddresses = new address[](0);
    core.createAgreement{ value: COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );
    vm.stopPrank();
  }

  function test_ReputationSystem() public {
    address user = participants[0];

    assertEq(core.getReputation(user), 0);

    vm.startPrank(owner);
    vm.deal(owner, TOTAL_REWARDS + COLLATERAL_AMOUNT);

    address[] memory whitelistedAddresses = new address[](0);
    address agreement = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );
    vm.stopPrank();

    vm.startPrank(agreement);
    core.addReputation(user);
    assertEq(core.getReputation(user), 1);

    core.subtractReputation(user);
    assertEq(core.getReputation(user), -1);
    vm.stopPrank();
  }

  function computeCreateAddress(address deployer, uint256 nonce) internal pure override returns (address) {
    return
      address(
        uint160(uint256(keccak256(abi.encodePacked(bytes1(0xd6), bytes1(0x94), deployer, bytes1(uint8(nonce))))))
      );
  }

  function test_AgreementIdTracking() public {
    vm.startPrank(owner);
    vm.deal(owner, (TOTAL_REWARDS + COLLATERAL_AMOUNT) * 3);

    address[] memory whitelistedAddresses = new address[](0);

    // Create multiple agreements
    address agreement1 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    address agreement2 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    // Test agreement counts and mappings
    assertEq(core.agreementToId(agreement1), 1);
    assertEq(core.agreementToId(agreement2), 2);
    assertEq(core.idToAgreement(1), agreement1);
    assertEq(core.idToAgreement(2), agreement2);

    vm.stopPrank();
  }

  // Test unauthorized agreement events
  function testFail_UnauthorizedAgreementEvents() public {
    address nonAgreement = address(0x123);
    vm.prank(nonAgreement);
    core.emitAgreementFinished(nonAgreement, 1);
  }

  // Test multiple reputation changes
  function test_MultipleReputationChanges() public {
    address user = participants[0];

    vm.startPrank(owner);
    vm.deal(owner, TOTAL_REWARDS + COLLATERAL_AMOUNT);

    address[] memory whitelistedAddresses = new address[](0);
    address agreement = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );
    vm.stopPrank();

    vm.startPrank(agreement);

    // Multiple reputation increases
    for (uint i = 0; i < 5; i++) {
      core.addReputation(user);
    }
    assertEq(core.getReputation(user), 5);

    // Multiple reputation decreases
    for (uint i = 0; i < 3; i++) {
      core.subtractReputation(user);
    }
    assertEq(core.getReputation(user), -1);

    vm.stopPrank();
  }

  // Test reputation changes from multiple agreements
  function test_ReputationFromMultipleAgreements() public {
    address user = participants[0];

    vm.startPrank(owner);
    vm.deal(owner, (TOTAL_REWARDS + COLLATERAL_AMOUNT) * 2);

    address[] memory whitelistedAddresses = new address[](0);
    address agreement1 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    address agreement2 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );
    vm.stopPrank();

    // Reputation changes from first agreement
    vm.startPrank(agreement1);
    core.addReputation(user);
    core.addReputation(user);
    vm.stopPrank();

    // Reputation changes from second agreement
    vm.startPrank(agreement2);
    core.addReputation(user);
    core.subtractReputation(user);
    vm.stopPrank();

    assertEq(core.getReputation(user), 1);
  }

  function test_CreateAgreementWithWhitelist() public {
    vm.startPrank(owner);
    vm.deal(owner, TOTAL_REWARDS + COLLATERAL_AMOUNT);

    address[] memory whitelistedAddresses = new address[](2);
    whitelistedAddresses[0] = participants[0];
    whitelistedAddresses[1] = participants[1];

    uint256 nonce = vm.getNonce(address(core));
    address expectedAgreement = computeCreateAddress(address(core), nonce);

    vm.expectEmit(true, true, false, true, address(core));
    emit IFederatedCore.AgreementCreated(
      expectedAgreement,
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD
    );

    address agreement = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      true, // isWhitelist
      whitelistedAddresses
    );

    assertEq(agreement, expectedAgreement);
    vm.stopPrank();
  }

  // Test agreement creation with various parameters
  function test_CreateAgreementParameters() public {
    vm.startPrank(owner);
    vm.deal(owner, TOTAL_REWARDS * 10 + COLLATERAL_AMOUNT * 10);

    address[] memory whitelistedAddresses = new address[](0);

    // Test with minimum values
    address agreement1 = core.createAgreement{ value: 1 wei + 1 wei }(
      owner,
      1 wei,
      1 wei,
      1,
      0,
      1,
      false,
      whitelistedAddresses
    );
    assertTrue(agreement1 != address(0));

    // Test with large values
    address agreement2 = core.createAgreement{ value: 100 ether + 10 ether }(
      owner,
      100 ether,
      10 ether,
      1000,
      1000,
      100,
      false,
      whitelistedAddresses
    );
    assertTrue(agreement2 != address(0));

    vm.stopPrank();
  }

  // Test multiple agreements with same parameters
  function test_DuplicateAgreements() public {
    vm.startPrank(owner);
    vm.deal(owner, (TOTAL_REWARDS + COLLATERAL_AMOUNT) * 3);

    address[] memory whitelistedAddresses = new address[](0);

    address agreement1 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    address agreement2 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    assertTrue(agreement1 != agreement2);
    assertTrue(core.agreementToId(agreement1) != core.agreementToId(agreement2));

    vm.stopPrank();
  }

  function test_MultipleOwners() public {
    vm.deal(owner, TOTAL_REWARDS + COLLATERAL_AMOUNT);
    vm.deal(participants[0], TOTAL_REWARDS + COLLATERAL_AMOUNT);

    address[] memory whitelistedAddresses = new address[](0);

    // Create agreement with first owner
    vm.prank(owner);
    address agreement1 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    // Create agreement with second owner
    vm.prank(participants[0]);
    address agreement2 = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      participants[0],
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      false,
      whitelistedAddresses
    );

    assertTrue(agreement1 != agreement2);
  }

  // Test agreement events from non-existent agreement
  function testFail_EventsFromNonExistentAgreement() public {
    address nonExistentAgreement = address(0x123);
    vm.prank(nonExistentAgreement);
    core.emitAgreementProceedNextRound(nonExistentAgreement, 1);
  }

  function test_EmptyWhitelist() public {
    vm.startPrank(owner);
    vm.deal(owner, TOTAL_REWARDS + COLLATERAL_AMOUNT);

    address[] memory emptyWhitelist = new address[](0);
    address agreement = core.createAgreement{ value: TOTAL_REWARDS + COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      MAXIMUM_ROUNDS,
      true,
      emptyWhitelist
    );

    assertTrue(agreement != address(0));
    vm.stopPrank();
  }

  receive() external payable {}
}
