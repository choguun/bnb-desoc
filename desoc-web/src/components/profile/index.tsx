/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ACCOUNT_CONTRACT, BSC_CHAIN_ID, BSC_RPC_URL, EXP_CONTRACT, LEVEL_CONTRACT, PROFILE_HANDLE_CONTRACT, REGISTRY_CONTRACT, SOCIAL_HUB_CONTRACT } from '@/env';
import toast from 'react-hot-toast';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'wagmi/chains';
import { socialHubAbi } from '@/utils/socialHubAbi';
import { HomeIcon, UserIcon } from '@heroicons/react/20/solid';
import useHandle from '@/hooks/useHandle';
import { profileHandleAbi } from '@/utils/profileHandleAbi';
import { useNavigate } from 'react-router-dom';
import IconUser from '@/assets/user.png';
import { registryAbi } from '@/utils/registryAbi';
import { expAbi } from '@/utils/expAbi';
import { levelAbi } from '@/utils/levelAbi';

const menu = [
    {
        icon: HomeIcon,
        name: 'Home',
        url: '/feed'
    },
    {
        icon: UserIcon,
        name: 'Profile',
        url: '/profile'
    }
];

export const Profile = () => {
    const { handle, saveHandle, currentAddress, saveCurrentAddress } = useHandle();
    const { address, isConnected, isConnecting, isReconnecting } = useAccount();
    const { data: walletClient } = useWalletClient();
    const navigate = useNavigate();

    const [tokenId, setTokenId] = useState(BigInt(0));
    const [tokenBoundAddress, setTokenBoundAddress] = useState('');
    const [exp, setEXP] = useState(0);
    const [level, setLevel] = useState(0);
    const [totalPosts, setTotalPosts] = useState(0);
    const [totalLikes, setTotalLikes] = useState(0);
    const [totalDislikes, setTotalDislikes] = useState(0);

    const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(BSC_RPC_URL)
    });

    const handleLevelUp = async () => {
      const loading = toast.loading('Level up...');
      try {
          const { request } = await publicClient.simulateContract({
              account: address,
              address: SOCIAL_HUB_CONTRACT,
              abi: socialHubAbi,
              functionName: 'levelUp',
              args: [tokenId]
          });
          const txn = await walletClient?.writeContract(request) as `0x${string}`;

          const result = await publicClient.waitForTransactionReceipt({ hash: txn })
          if (result.status === "success") {
              toast.success('Check-in Success');
              window.location.reload();
          }
      } catch (e) {
          console.log(e);
          toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
          toast.dismiss(loading);
      }
    };

    const handleCheckIn = async () => {
        const loading = toast.loading('Checking in...');
        try {
            const { request } = await publicClient.simulateContract({
                account: address,
                address: SOCIAL_HUB_CONTRACT,
                abi: socialHubAbi,
                functionName: 'dailyCheckIn',
                args: [tokenId]
            });
            const txn = await walletClient?.writeContract(request) as `0x${string}`;

            const result = await publicClient.waitForTransactionReceipt({ hash: txn })
            if (result.status === "success") {
                toast.success('Check-in Success');
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            toast.dismiss(loading);
        }
    };

    const fetchTokenBoundBalance = async () => {
      try {
        const expAmount = await publicClient.readContract({
            address: EXP_CONTRACT,
            abi: expAbi,
            functionName: 'balanceOf',
            args: [tokenBoundAddress as `0x${string}`],
        });
        await setEXP(Number(expAmount) / 10**18);

        const levelAmount = await publicClient.readContract({
          address: LEVEL_CONTRACT,
          abi: levelAbi,
          functionName: 'balanceOf',
          args: [tokenBoundAddress as `0x${string}`],
        });
        await setLevel(Number(levelAmount));

      await setEXP(Number(expAmount) / 10**18);
      } catch (e) {
          toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
          console.error(e);
      }
    };

    const fetchHandle = async () => {
        try {
            const handleTokenAmount = await publicClient.readContract({
                address: PROFILE_HANDLE_CONTRACT,
                abi: profileHandleAbi,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            });

            if(Number(handleTokenAmount) > 0) {
                const tokenId = await publicClient.readContract({
                  address: PROFILE_HANDLE_CONTRACT,
                  abi: profileHandleAbi,
                  functionName: 'tokenOfOwnerByIndex',
                  args: [address as `0x${string}`, BigInt(0)],
                });
                await setTokenId(tokenId);
        
                const handleName = await publicClient.readContract({
                  address: PROFILE_HANDLE_CONTRACT,
                  abi: profileHandleAbi,
                  functionName: 'profileHandle',
                  args: [tokenId],
                });
                await saveHandle(handleName);

               const tokenBoundAddress = await publicClient.readContract({
                  address: REGISTRY_CONTRACT,
                  abi: registryAbi,
                  functionName: 'account',
                  args: [ACCOUNT_CONTRACT, BigInt(BSC_CHAIN_ID), PROFILE_HANDLE_CONTRACT, tokenId, BigInt(1)]
                });
                await setTokenBoundAddress(tokenBoundAddress);

                const totalPosts = await publicClient.readContract({
                  address: SOCIAL_HUB_CONTRACT,
                  abi: socialHubAbi,
                  functionName: 'postTokenIdCount',
                  args: [tokenId]
                });
                await setTotalPosts(Number(totalPosts));

                let sumTotalLikes = 0;
                let sumTotalDislikes = 0;

                for(let i = 1; i <= Number(totalPosts); i++) {
                  const post = await publicClient.readContract({
                    address: SOCIAL_HUB_CONTRACT,
                    abi: socialHubAbi,
                    functionName: 'postwithProfile',
                    args: [tokenId, BigInt(i)]
                  });

                  const totalLikes = await publicClient.readContract({
                    address: SOCIAL_HUB_CONTRACT,
                    abi: socialHubAbi,
                    functionName: 'likeCount',
                    args: [BigInt(post[0])]
                  });
                  sumTotalLikes += Number(totalLikes);

                  const totalDislikes = await publicClient.readContract({
                    address: SOCIAL_HUB_CONTRACT,
                    abi: socialHubAbi,
                    functionName: 'dislikeCount',
                    args: [BigInt(post[0])]
                  });
                  sumTotalDislikes += Number(totalDislikes);
                }
                await setTotalLikes(sumTotalLikes);
                await setTotalDislikes(sumTotalDislikes);
            }

            if(Number(handleTokenAmount) === 0) {
                navigate('/');
            }
        } catch (e) {
          navigate('/');
        }
    };

    const syncAccount = async () => {
        if(address !== undefined && address?.length > 0) {
            await fetchHandle();
        }

        if(address !== currentAddress && currentAddress !== '') {
            await saveCurrentAddress(address);
            window.location.reload();
        }
    };

    useEffect(() => {
        fetchHandle();
    }, []);

    useEffect(() => {
        syncAccount();
    }, [address, isConnected, isConnecting, isReconnecting]);

    useEffect(() => {
      if(tokenBoundAddress.length > 0) {
        fetchTokenBoundBalance();
      }
    }, [tokenBoundAddress]);

    return (
        <>
          <div className="relative flex min-h-screen h-full w-full flex-col justify-center overflow-hidden bg-gray-50">
            <div className="bg-white mx-auto h-full w-full">
              <div className="grid grid-cols-12 h-full">
                {/* Left Panel */}
                <div className="bg-blue-900 p-10 col-span-3">
                  <div className="flex-grow">
                    <img src={IconUser} className="w-[150px] rounded-full mx-auto" alt="profile" />
                    <p className="font-bold text-blue-100 py-2 border-b border-white text-2xl text-center">
                      {handle}
                    </p>
                    {
                        menu.map((item, index) => {
                            return (
                                <div key={index} className="cursor-pointer">
                                    <div className="cursor-pointer" onClick={()=> navigate(item.url)}>
                                        <item.icon className="text-blue-100 h-6 w-6 group-hover:text-gray-500 inline-block" aria-hidden="true"/>
                                        <p className="ml-3 font-bold text-blue-100 py-4 inline-block">
                                            {item.name}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    }
                  </div>
                </div>
                {/* Left Panel */}
                {/* Center Panel */}
                <div className="bg-blue-50 p-7 col-span-6 h-screen overflow-y-auto no-scrollbar">
                  {/* EXP & Level Section */}
                  <div className="w-full">
            
                      <div className="inline-block">
                        <span className="text-lg font-bold">EXP Token: {exp}/100</span>
                        <span className="text-lg font-bold ml-4">LEVEL: {level}</span>
                      </div>
                      { exp >= 100 &&
                        <button className="bg-orange-300 ml-2" onClick={handleLevelUp}>Level Up</button>
                      }
                    <button className="bg-purple-300 float-right" onClick={handleCheckIn}>Daily Check-in</button>
                    <br/>
                    <div className="inline-block mt-3">
                        <span className="font-bold text-black ml-2">Total Posts: {totalPosts}</span><br/>
                        <span className="font-bold text-black ml-2">Total Like: {totalLikes}</span><br/>
                        <span className="font-bold text-black ml-2">Total Dislike: {totalDislikes}</span>
                      </div>
                  </div>
                   {/* Inventory section */}
                  <div className="w-full">
                    <div className="mt-10">
                      <span className="text-2xl font-semibold">INVENTORY</span><br/>
                      <span className="text-xl font-semibold text-center mx-auto">N/A</span>
                    </div>
                  </div>
                </div>
                {/* Center Panel */}
                {/* Right Panel */}
                <div className="bg-blue-900 p-10 col-span-3">
                  <div className="rounded-sm bg-white p-2 mt-3">
                    <span className="text-black">Top Tipping</span>
                  </div>
                  <div className="rounded-sm bg-white p-2 mt-3">
                    <span className="text-black">Top Minted Post</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
    )
};