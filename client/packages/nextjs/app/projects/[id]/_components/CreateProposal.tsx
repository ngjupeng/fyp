import { useContext, useState } from "react";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import toast from "react-hot-toast";
import { useAccount, useWriteContract } from "wagmi";
import GlobalContext from "~~/context/GlobalContext";
import deployedContracts from "~~/contracts/deployedContracts";
import { User } from "~~/types/User";

interface CreateProposalProps {
  participants: User[];
  agreementAddress: string;
  refetchProposals: any;
  projectStatus: string;
}

export default function CreateProposal({
  participants,
  agreementAddress,
  refetchProposals,
  projectStatus,
}: CreateProposalProps) {
  const agreementAbi = deployedContracts[8008148].FederatedAgreement.abi;

  let [isOpen, setIsOpen] = useState(false);
  let [suspiciousAddress, setSuspiciousAddress] = useState("");
  let [justification, setJustification] = useState("");
  const { userCredentials } = useContext(GlobalContext);

  const { address } = useAccount();

  const { writeContractAsync: agreementContractWrite } = useWriteContract();

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const handleOnChangeSuspiciousAddress = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSuspiciousAddress(e.target.value);
  };

  const handleOnChangeJustification = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJustification(e.target.value);
  };

  const handleCreate = async () => {
    if (userCredentials.address !== address) {
      toast.error("You are not using same wallet as the one binded to this account");
      return;
    }

    // if justification is empty, show error
    if (justification.trim() === "") {
      toast.error("Justification is required");
      return;
    }

    // if select himself, show error
    if (suspiciousAddress === address) {
      toast.error("You cannot select yourself");
      return;
    }

    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: agreementAddress,
        functionName: "createProposal",
        args: [suspiciousAddress, justification],
      });
      toast.success("Proposal created successfully");
      await refetchProposals();
      close();
      setJustification("");
    } catch (error) {
      console.log(error);
      toast.error("Failed to create proposal");
    }
  };

  return (
    <>
      {projectStatus.toLowerCase() === "running" && (
        <Button
          onClick={open}
          className="rounded-md bg-black/20 py-2 px-4 text-sm font-medium text-white focus:outline-none data-[hover]:bg-black/30 data-[focus]:outline-1 data-[focus]:outline-white"
        >
          Create New Proposal +
        </Button>
      )}

      <Dialog open={isOpen} as="div" className="relative z-10 focus:outline-none" onClose={close}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
            >
              <DialogTitle as="h3" className="text-base/7 font-medium text-white">
                Create New Proposal
              </DialogTitle>
              <p className="mt-2 text-sm/6 text-white/50">
                <div className="mb-4">
                  <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                    Suspicious Address
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    value={suspiciousAddress}
                    required
                    onChange={handleOnChangeSuspiciousAddress}
                  >
                    {participants.map(participant => (
                      <option value={participant.address}>{participant.address}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                    Justification
                  </label>
                  <textarea
                    name="email"
                    id="email"
                    placeholder="What is this project about?"
                    className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    value={justification}
                    onChange={handleOnChangeJustification}
                  />
                </div>
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[focus]:outline-1 data-[focus]:outline-white data-[open]:bg-gray-700"
                  onClick={handleCreate}
                >
                  Create
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
