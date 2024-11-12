"use client";

import React, { useContext, useState } from "react";
import QRCode from "qrcode.react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import Loading from "~~/components/Loading";
import GlobalContext from "~~/context/GlobalContext";
import useBindAddress from "~~/hooks/server/useBindAddress";
import useRequestProof from "~~/hooks/server/useRequestProof";
import { useGlobalState } from "~~/services/store/store";

const BindWallet = () => {
  const { userCredentials, currentUserDataRefetch } = useContext(GlobalContext);

  const { address, isConnected } = useAccount();

  const [requestProofUrl, setRequestProofUrl] = useState<string | null>(null);
  const bindAddressSuccess = (data: string) => {
    // refetch current user data
    currentUserDataRefetch();
    toast.success("Wallet bound successfully");
  };

  const bindAddressError = (error: any) => {
    toast.error(error.response.data.message);
  };

  const { mutate: bindAddress, isPending: bindAddressLoading } = useBindAddress(bindAddressSuccess, bindAddressError);
  const { mutate: requestProof, isPending: requestProofLoading } = useRequestProof(
    (data: any) => {
      setRequestProofUrl(JSON.parse(data)?.requestUrl);
      toast.dismiss();
      toast.success("Proof requested successfully");
    },
    error => {
      toast.dismiss();
      toast.error("Request proof failed");
    },
  );

  const handleBindWallet = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    bindAddress(address!);
  };

  return (
    <div className="flex justify-center">
      <div className="mt-10 w-[50%] mb-5">
        <div>
          <h3 className="text-lg font-semibold mb-2">What is bind wallet?</h3>
          <p className="text-sm text-gray-300">
            Binding your wallet allows you to associate a single Ethereum address with your account. Once bound, this
            address cannot be changed. To bind your wallet, simply connect your preferred wallet and click the "Bind
            Wallet" button.
          </p>
        </div>
        <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
          Current Wallet Address:
        </label>
        <input
          type="text"
          disabled
          name="email"
          id="email"
          placeholder={userCredentials.address != null ? userCredentials.address : "0x..."}
          className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
        />
        <div className="mt-5">
          {bindAddressLoading ? (
            <Loading />
          ) : (
            <button
              onClick={handleBindWallet}
              disabled={userCredentials.address != null}
              className="disabled:opacity-50 mb-10 hover:shadow-form w-full rounded-md bg-[#6A64F1] py-3 px-8 text-center text-base font-semibold text-white outline-none"
            >
              Bind Wallet
            </button>
          )}
        </div>{" "}
        <div>
          <h3 className="text-lg font-semibold mb-2">Identity Verification</h3>
          <div>
            <button
              onClick={() => {
                requestProof({
                  address: address || "0x0",
                  providerId: "c94476a0-8a75-4563-b70a-bf6124d7c59b",
                });

                toast.loading("Requesting proof...");
              }}
              type="button"
              className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 "
            >
              Kaggle
            </button>
            <button
              onClick={() => {
                requestProof({
                  address: address || "0x0",
                  providerId: "f9f383fd-32d9-4c54-942f-5e9fda349762",
                });

                toast.loading("Requesting proof...");
              }}
              type="button"
              className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg shadow-blue-500/50 dark:shadow-lg dark:shadow-blue-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 "
            >
              Google
            </button>
          </div>
        </div>
        {requestProofUrl && (
          <div className="mt-5 flex flex-col items-center">
            <QRCode value={requestProofUrl!} size={256} />
            <p className="mt-3 text-sm text-gray-300">Scan this QR code to verify your identity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BindWallet;
