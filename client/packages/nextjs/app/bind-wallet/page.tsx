"use client";

import React, { useContext } from "react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import Loading from "~~/components/Loading";
import GlobalContext from "~~/context/GlobalContext";
import useBindAddress from "~~/hooks/server/useBindAddress";
import { useGlobalState } from "~~/services/store/store";

const BindWallet = () => {
  const { userCredentials, currentUserDataRefetch } = useContext(GlobalContext);

  const { address, isConnected } = useAccount();

  const bindAddressSuccess = (data: string) => {
    // refetch current user data
    currentUserDataRefetch();
    toast.success("Wallet bound successfully");
  };

  const bindAddressError = (error: any) => {
    toast.error(error.response.data.message);
  };

  const { mutate: bindAddress, isPending: bindAddressLoading } = useBindAddress(bindAddressSuccess, bindAddressError);

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
      </div>
    </div>
  );
};

export default BindWallet;
