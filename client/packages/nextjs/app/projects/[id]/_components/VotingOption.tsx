import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { Proposal } from "~~/types/Projects";

interface VotingOptionProps {
  proposal: Proposal;
  agreementAddress: string;
  index: number;
  handleVote: (index: number, isVoteYes: boolean) => void;
}

const VotingOption = ({ proposal, index, agreementAddress, handleVote }: VotingOptionProps) => {
  const { address } = useAccount();
  const agreementAbi = deployedContracts[8008135].FederatedAgreement.abi;

  const { writeContractAsync: agreementContractWrite } = useWriteContract();

  const {
    data: hasVoted,
    isLoading: hasVotedLoading,
    refetch: refetchHasVoted,
  } = useReadContract({
    abi: agreementAbi,
    address: agreementAddress || "0x0",
    functionName: "hasVoted",
    args: [address || "0x0", BigInt(proposal.proposalId)],
  });

  const handleFinalizeProposal = async () => {
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: agreementAddress || "0x0",
        functionName: "finalizeProposal",
        args: [BigInt(index)],
      });
      toast.success("Proposal finalized");
    } catch (error) {
      console.log(error);
      toast.error("Finalize proposal failed");
    }
  };

  useEffect(() => {
    refetchHasVoted();
  }, [proposal]);

  return (
    <div>
      <div className="flex px-5 py-1">
        {address != proposal.proposer && !hasVoted && proposal.proposalStatus == 0 && (
          <button
            onClick={() => handleVote(index, false)}
            className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
            type="button"
          >
            Vote No
          </button>
        )}
        {address != proposal.proposer && !hasVoted && proposal.proposalStatus == 0 && (
          <button
            onClick={() => handleVote(index, true)}
            className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
            type="button"
          >
            Vote Yes
          </button>
        )}
        {hasVoted && <p className="text-white">You have already voted for this proposal.</p>}
      </div>
      <div className="ml-5">
        {proposal.proposalStatus == 0 && Number(new Date()) > Number(proposal.proposalVotingTime) * 1000 && (
          <button
            onClick={handleFinalizeProposal}
            className="text-red-300 border border-white hover:scale-[105%] transform cursor-pointer mb-5 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
            type="button"
          >
            Finalize Proposal
          </button>
        )}
      </div>
    </div>
  );
};

export default VotingOption;
{
  /* show the finalize proposal button when current time > proposal.voting time */
}
