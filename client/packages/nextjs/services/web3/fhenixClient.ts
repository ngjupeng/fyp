import { createPublicClient, http } from "viem";
import { defineChain } from "viem";

export const fhenix = defineChain({
  id: 8008135,
  name: "Helium",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "tFHE",
  },
  rpcUrls: {
    default: {
      http: ["https://api.helium.fhenix.zone"],
      webSocket: ["	wss://api.helium.fhenix.zone:8548"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.helium.fhenix.zone" },
  },
  contracts: {},
});

const publicClient = createPublicClient({
  chain: fhenix,
  transport: http(),
});

export { publicClient };
