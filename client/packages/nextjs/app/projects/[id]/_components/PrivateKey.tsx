import { useState } from "react";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import axios from "axios";
import { PinataSDK } from "pinata-web3";
import toast from "react-hot-toast";
import { useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import useAddSubmission from "~~/hooks/server/useAddSubmission";

interface PrivateKeyProps {
  privateKey: string;
}

export default function PrivateKey({ privateKey }: PrivateKeyProps) {
  const agreementAbi = deployedContracts[8008135].FederatedAgreement.abi;

  let [isOpen, setIsOpen] = useState(false);

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      <Button onClick={open} className="text-blue-500 cursor-pointer">
        <div>[Get private key]</div>
      </Button>

      <Dialog open={isOpen} as="div" className="relative z-10 focus:outline-none" onClose={close}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
            >
              <DialogTitle as="h3" className="text-base/7 font-medium text-white">
                This is the private key for this project!
              </DialogTitle>
              <p className="mt-2 text-sm/6 text-white/50">
                <div className="mb-5">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">
                    Please copy this private key and keep it safe.
                  </label>
                  <input
                    disabled
                    className="disabled:opacity-50 mb-10 hover:shadow-form w-full rounded-md bg-[#6A64F1] py-3 px-8 text-center text-base font-semibold text-white outline-none"
                    id="file_input"
                    type="text"
                    value={privateKey}
                  />
                </div>
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[focus]:outline-1 data-[focus]:outline-white data-[open]:bg-gray-700"
                  onClick={close}
                >
                  Ok
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
