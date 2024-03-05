/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { BSC_RPC_URL, PROFILE_HANDLE_CONTRACT, SOCIAL_HUB_CONTRACT } from '@/env';
import toast from 'react-hot-toast';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'wagmi/chains';
import { socialHubAbi } from '@/utils/socialHubAbi';
import { HomeIcon, WalletIcon, UserIcon } from '@heroicons/react/20/solid';
import { Comment } from '@/components/ui/Comment';
import useHandle from '@/hooks/useHandle';
import { Post } from '@/components/ui/Post';
import { profileHandleAbi } from '@/utils/profileHandleAbi';
import { useNavigate } from 'react-router-dom';
import IconUser from '@/assets/user.png';

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

export const Feed = () => {
    const { handle, saveHandle, currentAddress, saveCurrentAddress } = useHandle();
    const { address, isConnected, isConnecting, isReconnecting } = useAccount();
    const navigate = useNavigate();

    const [posts, setPosts] = useState<{ postNo: bigint; profileHandle: string; contentURI: string; }[]>([]);

    const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(BSC_RPC_URL)
    });

    const compareByNo = (a: any, b: any) => {
        if (a.postNo < b.postNo) {
          return 1;
        }
        if (a.postNo > b.postNo) {
          return -1;
        }
        return 0;
    };

    const fetchAllPosts = async () => {
        const id = toast.loading('Fetching Posts...');
        const postData = await publicClient.readContract({
            address: SOCIAL_HUB_CONTRACT,
            abi: socialHubAbi,
            functionName: 'getPosts'
        });

        let postArray = [];
        postArray = [...postData];
        postArray.sort(compareByNo);
        // console.log(postArray);
        setPosts(postArray);
        toast.dismiss(id);
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
        
                const handleName = await publicClient.readContract({
                  address: PROFILE_HANDLE_CONTRACT,
                  abi: profileHandleAbi,
                  functionName: 'profileHandle',
                  args: [tokenId],
                });
                await saveHandle(handleName);
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
        fetchAllPosts();
    }, []);

    useEffect(() => {
        syncAccount();
    }, [address, isConnected, isConnecting, isReconnecting]);

    return (
        <>
          <div className="relative flex min-h-screen h-full w-full flex-col justify-center overflow-hidden bg-gray-50">
            <div className="bg-white mx-auto h-full w-full">
              <div className="grid grid-cols-12 h-full">
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
                <div className="bg-blue-50 p-7 col-span-6 h-screen overflow-y-auto no-scrollbar">
                  <div className="mb-3">
                    <Comment />
                  </div>
                  <div className="mt-3">
                    {
                        posts.map((post, index) => {
                            return (
                                <Post key={index} post={post} />
                            )
                        })
                    }
                  </div>
                </div>
                <div className="bg-blue-900 p-10 col-span-3">
                  {/* <div className="rounded-sm bg-white p-2">
                    <span className="text-black">Top Subscribed</span>
                  </div> */}
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