"use client";

import React, { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AddSubmission from "./_components/AddSubmission";
import CreateProposal from "./_components/CreateProposal";
import PrivateKey from "./_components/PrivateKey";
import VotingOption from "./_components/VotingOption";
import { Button } from "@headlessui/react";
import { JsonRpcProvider } from "ethers";
import { FhenixClient, getPermit } from "fhenixjs";
import toast from "react-hot-toast";
import { formatEther, formatUnits, keccak256, parseEther, toBytes } from "viem";
import { useAccount, useReadContract, useSimulateContract, useWriteContract } from "wagmi";
import Loading from "~~/components/Loading";
import GlobalContext from "~~/context/GlobalContext";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import useJoinProject from "~~/hooks/server/useJoinProject";
import useProjectCurrentRoundDetail from "~~/hooks/server/useProjectCurrentRoundDetail";
import useProjectDetails from "~~/hooks/server/useProjectDetails";
import useProjectPreviousRoundDetail from "~~/hooks/server/useProjectPreviousRoundDetail";
import useStartProject from "~~/hooks/server/useStartProject";
import { publicClient } from "~~/services/web3/fhenixClient";

const ProjectDetail = () => {
  const agreementAbi = deployedContracts[8008148].FederatedAgreement.abi;

  const { id } = useParams();
  const { address } = useAccount();
  const { userCredentials } = useContext(GlobalContext);

  const [queryRound, setQueryRound] = useState(0);

  const {
    data: projectDetail,
    isLoading: projectDetailsLoading,
    refetch: refetchProjectDetails,
  } = useProjectDetails(Number(id));

  console.log(projectDetail);
  const {
    data: projectCurrentRoundDetail,
    isLoading: projectCurrentRoundDetailLoading,
    refetch: refetchProjectCurrentRoundDetail,
  } = useProjectCurrentRoundDetail(Number(id), projectDetail?.currentRound ?? 0);

  const {
    data: projectPreviousRoundDetail,
    isLoading: projectPreviousRoundDetailLoading,
    refetch: refetchProjectPreviousRoundDetail,
  } = useProjectPreviousRoundDetail(Number(id), queryRound);

  useEffect(() => {
    refetchProjectPreviousRoundDetail();
  }, [queryRound]);

  const { data: reputation, isLoading: reputationLoading } = useScaffoldReadContract({
    contractName: "FederatedCore",
    functionName: "getReputation",
    args: [userCredentials.address || "0x0"],
  });

  const {
    data: roundStateConfirmedCount,
    isLoading: roundStateConfirmedCountLoading,
    refetch: refetchRoundStateConfirmedCount,
  } = useReadContract({
    abi: agreementAbi,
    address: projectDetail?.agreementAddress || "0x0",
    functionName: "roundStateConfirmedCount",
    args: [BigInt((projectDetail?.currentRound ?? 0) - 1)],
  });

  const {
    data: proposals,
    isLoading: proposalsLoading,
    refetch: refetchProposals,
  } = useReadContract({
    abi: agreementAbi,
    address: projectDetail?.agreementAddress || "0x0",
    functionName: "getProposals",
    args: [],
  });

  const {
    data: rewards,
    isLoading: rewardsLoading,
    refetch: refetchRewards,
  } = useReadContract({
    abi: agreementAbi,
    address: projectDetail?.agreementAddress || "0x0",
    functionName: "calculateRewards",
    args: [userCredentials?.address || "0x0"],
  });

  const {
    data: redeemableCollateralIfRandomSampling,
    isLoading: redeemableCollateralIfRandomSamplingFailureLoading,
    refetch: refetchRedeemableCollateralIfRandomSamplingFailure,
  } = useReadContract({
    abi: agreementAbi,
    address: projectDetail?.agreementAddress || "0x0",
    functionName: "getRedeemCollateralIfRandomSampling",
    args: [userCredentials?.address || "0x0"],
  });

  console.log("---------redeemableCollateralIfRandomSampling-----------------------");
  console.log(redeemableCollateralIfRandomSampling);
  console.log("--------------------------------");

  const {
    data: collaterals,
    isLoading: collateralsLoading,
    refetch: refetchCollaterals,
  } = useReadContract({
    abi: agreementAbi,
    address: projectDetail?.agreementAddress || "0x0",
    functionName: "collaterals",
    args: [userCredentials?.address || "0x0"],
  });

  const {
    data: roundStateConfirmed,
    isLoading: roundStateConfirmedLoading,
    refetch: refetchRoundStateConfirmed,
  } = useReadContract({
    abi: agreementAbi,
    address: projectDetail?.agreementAddress || "0x0",
    functionName: "roundStateConfirmed",
    args: [userCredentials?.address || "0x0", BigInt((projectDetail?.currentRound ?? 0) - 1)],
  });

  const { data: privateKey } = useSimulateContract({
    abi: agreementAbi,
    address: projectDetail?.agreementAddress || "0x0",
    functionName: "getPrivateKey",
    args: [],
    account: userCredentials.address,
  });

  const { writeContractAsync: agreementContractWrite } = useWriteContract();

  const { mutate: joinProject, isPending: joinProjectPending } = useJoinProject(
    async () => {
      toast.success("Join project success");
      await refetchProjectDetails();
    },
    (err: string) => {
      toast.error(err);
    },
  );

  const { mutate: startProject, isPending: startProjectPending } = useStartProject(
    async () => {
      toast.success("Start project success");
      await refetchProjectDetails();
    },
    (err: string) => {
      toast.error(err);
    },
  );

  const handleJoin = async () => {
    if (userCredentials.address == null || userCredentials.address == "") {
      toast.error("Please bind wallet first");
      return;
    }

    // first check if user is already a participant
    const isParticipant = projectDetail?.participants.find(
      participant => participant.address == userCredentials.address,
    );
    if (isParticipant) {
      toast.error("You are already a participant");
      return;
    }

    // check user reputation
    const userReputation = parseInt(reputation?.toString() ?? "");
    if (userReputation < (projectDetail?.minimumReputation ?? 0)) {
      toast.error("You do not have enough reputation to join this project");
      return;
    }

    try {
      // call contract add pariticipant
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "addParticipant",
        args: [userCredentials.address],
        value: parseEther(projectDetail?.collateralAmount.toString() ?? "0"),
      });
      // if call success
      // update project details
      // refetch project details
      joinProject(Number(id));
    } catch (error) {
      console.log(error);
      toast.error("Join project failed");
    }
  };

  const handleStart = async () => {
    if (userCredentials.address == null || userCredentials.address == "") {
      toast.error("Please bind wallet first");
      return;
    }

    // check if creator
    if (projectDetail?.creator.address != address) {
      toast.error("You are not the creator of this project or not using same wallet");
      return;
    }

    try {
      // call contract add pariticipant
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "startAgreement",
        args: [],
      });
      // if call success
      // update project details
      // refetch project details
      startProject(Number(id));
    } catch (error) {
      console.log(error);
      toast.error("Start project failed");
    }
  };

  const handleConfirmState = async () => {
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "confirmRoundState",
        args: [],
      });
      // get contract address
      const receipt = await publicClient.getTransactionReceipt({
        hash: result!,
      });
      // Check if any logs match the AgreementProceedNextRound event signature
      const proceedNextRoundEvent = receipt.logs.find(log => {
        // Get the event signature for AgreementProceedNextRound(address,uint256)
        const eventSignature = "AgreementProceedNextRound(address,uint256)";
        const eventFinishSignature = "AgreementFinished(address,uint256)";
        const eventHash = keccak256(toBytes(eventSignature));
        const eventFinishHash = keccak256(toBytes(eventFinishSignature));
        return log.topics[0] === eventHash || log.topics[0] === eventFinishHash;
      });

      if (proceedNextRoundEvent) {
        // Call server endpoint to handle next round
        try {
          await fetch(`http://localhost:3001/round/proceed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agreementAddress: projectDetail?.agreementAddress,
            }),
          });
        } catch (error) {
          console.error("Failed to notify server about next round:", error);
        }
      }
      await refetchRoundStateConfirmedCount();
      await refetchRoundStateConfirmed();
      toast.success("Confirm state success");
    } catch (error) {
      console.log(error);
      toast.error("Failed to confirm state");
    }
  };

  const handleVote = async (index: number, isVoteYes: boolean) => {
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "voteProposal",
        args: [BigInt(index), isVoteYes],
      });
      await refetchProposals();
      toast.success("Vote success");
    } catch (error) {
      console.log(error);
      toast.error("Failed to vote");
    }
  };

  const handleRedeemRewards = async () => {
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "redeemRewards",
        args: [],
      });
      await refetchRewards();
      toast.success("Redeem rewards success");
    } catch (error) {
      console.log(error);
      toast.error("Failed to redeem rewards");
    }
  };

  const handleRedeemCollateralIfRandomSampling = async () => {
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "redeemCollateralIfRandomSampling",
        args: [],
      });
      await refetchRedeemableCollateralIfRandomSamplingFailure();
      toast.success("Redeem collateral success");
    } catch (error) {
      console.log(error);
      toast.error("Failed to redeem collateral");
    }
  };

  const handleRedeemCollateral = async () => {
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "redeemCollateral",
        args: [],
      });
      await refetchCollaterals();
      toast.success("Redeem collateral success");
    } catch (error) {
      console.log(error);
      toast.error("Failed to redeem collateral");
    }
  };

  const hndleFinishAgreement = async () => {
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: projectDetail?.agreementAddress || "0x0",
        functionName: "finishAgreement",
        args: [],
      });
      toast.success("End agreement earlier success!");
      await refetchProjectDetails();
    } catch (error) {
      console.log(error);
      toast.error("Failed to end agreement earlier");
    }
  };

  // async function settlePrivateKey(privateKey: any) {
  //   const encHigh = privateKey?.result[0]["data"];
  //   const encLow = privateKey?.result[1]["data"];
  //   const remainder = privateKey?.result[2];

  //   const provider: any = new JsonRpcProvider("https://api.nitrogen.fhenix.zone");

  //   // initialize Fhenix Client
  //   const client = new FhenixClient({ provider });

  //   try {
  //     const permit = await getPermit(projectDetail?.agreementAddress || "0x0", provider as any);
  //     client.storePermit(permit as any, address as any);
  //     const permission = client.extractPermitPermission(permit as any);
  //     const data = client.unseal(contractAddress, response);

  //     // let encryptedLast30 = await client.encrypt(last30, EncryptionTypes.uint128);
  //   } catch (e) {}
  // }

  useEffect(() => {}, [privateKey]);

  return (
    <div className="bg-gray-900">
      <main className="py-6 px-12 space-y-12 min-h-screen w-full">
        {projectDetailsLoading ||
        reputationLoading ||
        rewardsLoading ||
        collateralsLoading ||
        redeemableCollateralIfRandomSamplingFailureLoading ? (
          <div className="flex justify-center mt-10">
            <Loading />
          </div>
        ) : (
          <div className="flex flex-col h-full w-full mx-auto  space-y-6">
            <section className="flex flex-col mx-auto rounded-lg p-6 shadow-sm shadow-secondary space-y-6 w-full">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-bold text-white">{projectDetail?.name}</h2>
                  {/* only show this if user is participant */}
                  <div>
                    {projectDetail?.participants.find(participant => participant.address == userCredentials.address) ? (
                      <PrivateKey
                        privateKey={(privateKey?.result[0]["data"].toString().padStart(16, "0") ?? "")
                          .concat(privateKey?.result[2]?.toString() ?? "")
                          .concat(privateKey?.result[1]["data"].toString().padStart(16, "0") ?? "")}
                      />
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
                {projectDetail?.status.toLowerCase() === "pending" &&
                  projectDetail?.creator.address == userCredentials?.address && (
                    <div>
                      <button
                        onClick={handleStart}
                        type="button"
                        className="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800"
                      >
                        Start
                      </button>
                    </div>
                  )}
                {projectDetail?.status.toLowerCase() === "running" &&
                  projectDetail?.currentRound > 0 &&
                  projectDetail?.creator.address == userCredentials?.address && (
                    <button
                      onClick={hndleFinishAgreement}
                      type="button"
                      className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
                    >
                      End
                    </button>
                  )}
                {projectDetail?.status.toLowerCase() === "pending" &&
                  projectDetail?.creator.address != userCredentials?.address &&
                  projectDetail?.participants.find(participant => participant.address == userCredentials?.address) ==
                    undefined && (
                    <div>
                      <button
                        onClick={handleJoin}
                        type="button"
                        className="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800"
                      >
                        Join
                      </button>
                    </div>
                  )}
              </div>
              {/* <!-- projects --> */}
              <div className="container mx-auto">
                <p>Your Reputation: {reputation?.toString()}</p>
                <p>{projectDetail?.description}</p>

                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Project Details
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Creator
                        </th>
                        <td className="px-6 py-4">{projectDetail?.creator.address}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Verification Dataset URL
                        </th>
                        <td className="px-6 py-4">{projectDetail?.verificationDatasetURL}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Status
                        </th>
                        <td className="px-6 py-4">
                          <span
                            className={`${
                              projectDetail?.status.toLowerCase() === "running"
                                ? "bg-green-500"
                                : projectDetail?.status.toLowerCase() === "pending"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            } text-xs font-semibold px-2 py-1 rounded-full text-white`}
                          >
                            {projectDetail?.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Initial global model
                        </th>
                        <td
                          onClick={() => {
                            // open ipfs
                            window.open(`https://ipfs.io/ipfs/${projectDetail?.initialGlobalModel}`, "_blank");
                          }}
                          className="cursor-pointer px-6 py-4 text-blue-400"
                        >
                          {projectDetail?.initialGlobalModel}
                        </td>
                      </tr>

                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          n
                        </th>
                        <td className="cursor-pointer px-6 py-4">{projectDetail?.n}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Participants Amount
                        </th>
                        <td className="px-6 py-4">
                          {projectDetail?.participants?.length} / {projectDetail?.maximumParticipantAllowed} (Exceeding
                          participant will be chosen randomly)
                        </td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Maximum Participants
                        </th>
                        <td className="px-6 py-4">{projectDetail?.maximumParticipantAllowed}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Maximum Rounds
                        </th>
                        <td className="px-6 py-4">{projectDetail?.maximumRounds}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Current Round
                        </th>
                        <td className="px-6 py-4"> {projectDetail?.currentRound}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Minimum Reputation
                        </th>
                        <td className="px-6 py-4">{projectDetail?.minimumReputation}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Collateral Amount
                        </th>
                        <td className="px-6 py-4">{projectDetail?.collateralAmount}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Total Reward Amount
                        </th>
                        <td className="px-6 py-4">{projectDetail?.totalRewardAmount}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Agreement Address
                        </th>
                        <td className="px-6 py-4">{projectDetail?.agreementAddress}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Whitelist
                        </th>
                        <td className="px-6 py-4">{projectDetail?.isWhitelist ? "Yes" : "No"}</td>
                      </tr>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Whitelist Address
                        </th>
                        <td className="px-6 py-4">
                          {projectDetail?.whitelistedAddress.map(address => (
                            <div key={address}>{address}</div>
                          ))}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-6">
                    <h2 className="text-xl font-bold text-white">Participants</h2>
                    <div className="max-h-[300px] overflow-y-scroll">
                      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <tbody>
                          {projectDetail?.participants?.map(participant => (
                            <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                              <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                              >
                                {participant.name}
                              </th>
                              <td className="px-6 py-4">{participant.address}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* here only show if project is started */}
                  {projectDetail && projectDetail?.currentRound > 0 && (
                    <div>
                      <div className="mt-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-white">
                            {projectDetail?.status.toLowerCase() == "running" ? "Current round " : "Latest round"}
                            participant Submission
                          </h3>
                          <div className="flex gap-3">
                            {roundStateConfirmed == false &&
                              projectDetail?.status.toLowerCase() === "running" &&
                              redeemableCollateralIfRandomSampling! <= 0 && (
                                <Button
                                  onClick={handleConfirmState}
                                  className="rounded-md bg-black/20 py-2 px-4 text-sm font-medium text-white focus:outline-none data-[hover]:bg-black/30 data-[focus]:outline-1 data-[focus]:outline-white"
                                >
                                  Confirm State
                                </Button>
                              )}
                            <AddSubmission
                              g={projectDetail?.g}
                              n={projectDetail?.n}
                              currentRound={projectDetail?.currentRound}
                              structure={projectDetail?.fileStructure}
                              projectId={Number(id)}
                              agreementAddress={projectDetail?.agreementAddress}
                              refetchProjectCurrentRoundDetail={refetchProjectCurrentRoundDetail}
                              projectStatus={projectDetail?.status}
                            />
                          </div>
                        </div>
                        <h4 className="my-2 text-lg">
                          {projectDetail?.status.toLowerCase() == "running" ? "Current round" : "Latest round"} global
                          model:{" "}
                          <span
                            className="font-bold text-blue-500 cursor-pointer"
                            onClick={() => {
                              // open ipfs
                              window.open(
                                `https://ipfs.io/ipfs/${projectCurrentRoundDetail?.round.globalModelIPFSLink}`,
                                "_blank",
                              );
                            }}
                          >
                            {projectCurrentRoundDetail?.round.globalModelIPFSLink}
                          </span>
                        </h4>
                        <h4 className="my-2 text-lg">
                          {projectDetail?.status.toLowerCase() == "running" ? "Current round" : "Latest round"}{" "}
                          confirmed state:{" "}
                          <span className="font-bold">
                            {roundStateConfirmedCount?.toString()}/{projectDetail?.participants?.length}
                          </span>
                        </h4>
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                              <th scope="col" className="px-6 py-3">
                                Participant
                              </th>
                              <th scope="col" className="px-6 py-3">
                                IPFS Submission
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectCurrentRoundDetail?.submissions?.map(submission => (
                              <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                <th
                                  scope="row"
                                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                  {submission.participant.address}
                                </th>
                                <td className="px-6 py-4">
                                  <span
                                    className="cursor-pointer text-blue-500"
                                    onClick={() => {
                                      window.open(`https://ipfs.io/ipfs/${submission.IPFSLink}`, "_blank");
                                    }}
                                  >
                                    {submission.IPFSLink}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-white">
                            {projectDetail?.status.toLowerCase() == "running" ? "Current round" : "Latest round"}{" "}
                            Proposal
                          </h3>
                          <CreateProposal
                            participants={projectDetail?.participants}
                            agreementAddress={projectDetail?.agreementAddress}
                            refetchProposals={refetchProposals}
                            projectStatus={projectDetail?.status}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                          <div className="">
                            {proposals?.map((proposal, index) => (
                              <div className="w-full relative flex flex-col mt-6 text-white border border-base-100 shadow-md bg-clip-border rounded-xl">
                                <div className="p-6">
                                  {address == proposal.proposer && (
                                    <div className="mb-5 text-sm text-green-500">Your proposal</div>
                                  )}

                                  <h5 className="block mb-2 font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                                    Proposal of SUSPICIOUS ON{" "}
                                    <span
                                      className="cursor-pointer text-blue-500"
                                      onClick={() => {
                                        // open address
                                        window.open(
                                          `https://explorer.helium.fhenix.zone/address/${proposal?.suspiciousParticipant}`,
                                          "_blank",
                                        );
                                      }}
                                    >
                                      {proposal.suspiciousParticipant}
                                    </span>
                                  </h5>
                                  <p className="block font-sans text-base antialiased font-light leading-relaxed text-inherit">
                                    {proposal?.proposalDescription}
                                  </p>
                                  <p className="block font-sans text-base antialiased font-light leading-relaxed text-inherit">
                                    Proposer:{" "}
                                    <span
                                      className="cursor-pointer text-blue-500"
                                      onClick={() => {
                                        // open address
                                        window.open(
                                          `https://explorer.helium.fhenix.zone/address/${proposal?.proposer}`,
                                          "_blank",
                                        );
                                      }}
                                    >
                                      {proposal?.proposer}
                                    </span>
                                  </p>
                                  <p className="block font-sans text-base antialiased font-light leading-relaxed text-inherit">
                                    Voting time until:{" "}
                                    {new Date(Number(proposal?.proposalVotingTime) * 1000).toLocaleString()}
                                  </p>
                                  <p className="block font-sans text-base antialiased font-light leading-relaxed text-inherit">
                                    Total votes yes: {Number(proposal?.proposalVotesYes)}
                                  </p>
                                  <p className="block font-sans text-base antialiased font-light leading-relaxed text-inherit">
                                    Total votes no: {Number(proposal?.proposalVotesNo)}
                                  </p>
                                  <p className="block font-sans text-base antialiased font-light leading-relaxed text-inherit">
                                    Proposal status:{" "}
                                    {Number(proposal?.proposalStatus) == 0
                                      ? "VOTING"
                                      : Number(proposal?.proposalStatus) == 1
                                      ? "ACCEPTED"
                                      : "REJECTED"}
                                  </p>
                                </div>
                                <VotingOption
                                  proposal={proposal}
                                  agreementAddress={projectDetail?.agreementAddress}
                                  index={index}
                                  handleVote={handleVote}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-xl font-bold text-white">Query Previous Round Submission</h3>

                        <div className="relative">
                          <input
                            value={queryRound}
                            onChange={e => setQueryRound(Number(e.target.value))}
                            type="number"
                            className="w-full pl-3 pr-3 py-3 bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
                            placeholder="Round Number"
                          />
                        </div>

                        <table className="mt-5 w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                              <th scope="col" className="px-6 py-3">
                                Participant
                              </th>
                              <th scope="col" className="px-6 py-3">
                                IPFS Submission
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectPreviousRoundDetail?.submissions?.map(submission => (
                              <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                                <th
                                  scope="row"
                                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                  {submission.participant.address}
                                </th>
                                <td className="px-6 py-4">
                                  <span
                                    className="cursor-pointer text-blue-500"
                                    onClick={() => {
                                      window.open(`https://ipfs.io/ipfs/${submission.IPFSLink}`, "_blank");
                                    }}
                                  >
                                    {submission.IPFSLink}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-xl font-bold text-white">Collateral & Reward</h3>

                        <div className="relative">
                          <div>
                            Your reward amount: {parseFloat(formatUnits(BigInt(rewards ?? 0), 18))} TFHE
                            <span onClick={handleRedeemRewards} className="text-blue-500 cursor-pointer">
                              [Redeem]
                            </span>
                          </div>
                          <div>
                            Your collateral amount: {formatUnits(collaterals || BigInt(0), 18)} TFHE
                            <span className="text-blue-500 cursor-pointer" onClick={handleRedeemCollateral}>
                              [Redeem]
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-xl font-bold text-white">
                          Redeemable collateral due to failure to select as participant
                        </h3>

                        <div className="relative">
                          <div>
                            Redeemable collateral:{" "}
                            {parseFloat(formatUnits(BigInt(redeemableCollateralIfRandomSampling ?? 0), 18))} TFHE
                            <span
                              onClick={handleRedeemCollateralIfRandomSampling}
                              className="text-blue-500 cursor-pointer"
                            >
                              [Redeem]
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetail;
