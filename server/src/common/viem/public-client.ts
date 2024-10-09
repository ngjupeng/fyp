import { createPublicClient, http } from 'viem';
import { fhenix } from './custom-chain';

const publicClient = createPublicClient({
  chain: fhenix,
  transport: http(),
});

export { publicClient };
