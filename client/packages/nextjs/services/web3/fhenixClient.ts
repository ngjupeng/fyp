import { createPublicClient, http } from "viem";
import { defineChain } from "viem";

export const fhenix = defineChain({
  id: 8008148,
  name: "fhenix",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "FHE",
  },
  rpcUrls: {
    default: {
      http: ["https://api.nitrogen.fhenix.zone"],
      webSocket: ["wss://api.nitrogen.fhenix.zone:8548"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.nitrogen.fhenix.zone" },
  },
  contracts: {},
});

const publicClient = createPublicClient({
  chain: fhenix,
  transport: http(),
});

export { publicClient };
