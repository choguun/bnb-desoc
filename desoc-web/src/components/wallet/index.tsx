/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { BSC_RPC_URL, SOCIAL_HUB_CONTRACT, TOKEN_CONTRACT } from '@/env';
import toast from 'react-hot-toast';
import { useWalletClient } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'wagmi/chains';
import { socialHubAbi } from '@/utils/socialHubAbi';
import { erc20Abi } from '@/utils/erc20Abi';

export const Wallet = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http(BSC_RPC_URL)
  });

  const [tokenBalance, setTokenBalance] = useState(0);

  const openWeb = () => {
    window.open('https://greenfield.bnbchain.org/en/bridge?type=transfer-in', '_blank');
  };

  const handleFaucet = async () => {
    const loading = toast.loading('Faucet...');
    try{
        const { request } = await publicClient.simulateContract({
            account: address,
            address: SOCIAL_HUB_CONTRACT,
            abi: socialHubAbi,
            functionName: 'faucet'
        });
        const txn = await walletClient!.writeContract(request);
        toast(txn);

        const result = await publicClient.waitForTransactionReceipt({ hash: txn })
        if (result.status === "success") {
            toast.success('Faucet Success');
            window.location.reload();
        }
    } catch (e) {
        console.log(e);
        toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
        toast.dismiss(loading);
    }
  };

  const fetchTokenBalance = async () => {
    const balance = await publicClient.readContract({
      address: TOKEN_CONTRACT,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    await setTokenBalance(Number(balance)/ 10**18);
  };

  useEffect(() => {
    fetchTokenBalance();
  }, [address, isConnected, isConnecting, isReconnecting]);

  return (
    <nav className="top-0 mb-2 px-4">
      <div className="flex mt-1 flex-row items-center">
        <ConnectButton accountStatus="address" />
        <button onClick={()=> openWeb()} className="ml-2 bg-white py-1 cursor-pointer">Bridge BSC and Green field</button>
        <button onClick={()=> handleFaucet()} className="ml-2 bg-white py-1 cursor-pointer">Faucet OsToken</button>
        <button className="ml-2 bg-green-200 py-1">${tokenBalance.toLocaleString()} Os</button>
      </div>
    </nav>
  );
};
