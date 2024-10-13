import React from "react";
import { hardhat } from "viem/chains";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

/**
 * Site footer
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <footer className="bg-gray-800 footer footer-center text-base-content p-4">
    <aside>
      <p>Copyright © {new Date().getFullYear()} - All right reserved by SWE2109771 Ng Ju Peng</p>
    </aside>
  </footer>
  );
};
