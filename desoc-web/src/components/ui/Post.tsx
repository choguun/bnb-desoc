// Comment.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSwitchNetwork } from 'wagmi';
import { BSC_CHAIN_ID, BSC_RPC_URL, SOCIAL_HUB_CONTRACT, TOKEN_CONTRACT } from '@/env';
import toast from 'react-hot-toast';
import { useWalletClient } from 'wagmi';
import { createPublicClient, http, parseUnits } from 'viem';
import { bscTestnet } from 'wagmi/chains';
import useHandle from '@/hooks/useHandle';
import { socialHubAbi } from '@/utils/socialHubAbi';
import { nftAbi } from '@/utils/nftAbi';
import { erc20Abi } from '@/utils/erc20Abi';
import IconUser from '@/assets/user.png';

export const Post = ({post} : any) => {
    const { address } = useAccount();
    const { handle } = useHandle();
    const { switchNetwork } = useSwitchNetwork();
    const { data: walletClient } = useWalletClient();
    const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(BSC_RPC_URL)
    });

    const [metaData, setMetaData] = useState({} as any);
    const [loading, setLoading] = useState(true);
    const [totalLike, setTotalLike] = useState(0);
    const [totalDislike, setTotalDislike] = useState(0);
    const [totalTip, setTotalTip] = useState(0);
    const [isTokenized, setIsTokenized] = useState(false);
    const [nft, setNFT] = useState('0x' as `0x${string}`);
    const [totalMint, setTotalMint] = useState(0);

    const handleLike = async (postNo: any) => {
        const loading = toast.loading('Like Post...');
        try{
            const { request } = await publicClient.simulateContract({
                account: address,
                address: SOCIAL_HUB_CONTRACT,
                abi: socialHubAbi,
                functionName: 'likePost',
                args: [postNo]
            });
            const txn = await walletClient!.writeContract(request);
            toast(txn);

            const result = await publicClient.waitForTransactionReceipt({ hash: txn })
            if (result.status === "success") {
                toast.success('Like Post Success');
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            toast.dismiss(loading);
        }
    };

    const handleDislike = async (postNo: any) => {
        const loading = toast.loading('Dislike Post...');
        try{
            const { request } = await publicClient.simulateContract({
                account: address,
                address: SOCIAL_HUB_CONTRACT,
                abi: socialHubAbi,
                functionName: 'dislikePost',
                args: [postNo]
            });
            const txn = await walletClient!.writeContract(request);
            toast(txn);

            const result = await publicClient.waitForTransactionReceipt({ hash: txn })
            if (result.status === "success") {
                toast.success('Dislike Post Success');
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            toast.dismiss(loading);
        }
    };

    const handleTip = async (postNo: any, amount: any) => {
        const loading = toast.loading('Tip Post...');
        try{
            const { request: request1 } = await publicClient.simulateContract({
                account: address,
                address: TOKEN_CONTRACT,
                abi: erc20Abi,
                functionName: 'approve',
                args: [SOCIAL_HUB_CONTRACT, amount]
            });

            const txn1 = await walletClient!.writeContract(request1);
            toast(txn1);  

            const { request } = await publicClient.simulateContract({
                account: address,
                address: SOCIAL_HUB_CONTRACT,
                abi: socialHubAbi,
                functionName: 'tipPost',
                args: [postNo, amount]
            });
            const txn = await walletClient!.writeContract(request);
            toast(txn);

            const result = await publicClient.waitForTransactionReceipt({ hash: txn })
            if (result.status === "success") {
                toast.success('Tip Post Success');
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            toast.dismiss(loading);
        }
    };

    const handleTokenize = async (postNo: any, price: any, supply: any) => {
        const loading = toast.loading('Like Post...');
        try{
            const { request } = await publicClient.simulateContract({
                account: address,
                address: SOCIAL_HUB_CONTRACT,
                abi: socialHubAbi,
                functionName: 'tokenizePost',
                args: [postNo, price, supply, post.contentURI],
                value: parseUnits('0.01', 18)
            });
            const txn = await walletClient!.writeContract(request);
            toast(txn);

            const result = await publicClient.waitForTransactionReceipt({ hash: txn })
            if (result.status === "success") {
                toast.success('Tokenize Post Success');
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            toast.dismiss(loading);
        }
    };
    
    const handleMintNFT = async (postNo: any, amount: any) => {
        const loading = toast.loading('Mint NFT...');
        try{
            const { request } = await publicClient.simulateContract({
                account: address,
                address: nft,
                abi: nftAbi,
                functionName: 'mint',
                args: [address as `0x${string}`],
                value: amount
            });
            const txn = await walletClient!.writeContract(request);
            toast(txn);

            const result = await publicClient.waitForTransactionReceipt({ hash: txn })
            if (result.status === "success") {
                toast.success('Mint NFT Success');
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            toast.dismiss(loading);
        }
    };

    const fetchMetadata = async () => {
        const metadata = await axios.get(post.contentURI);
        // console.log(metadata.data);
        await setMetaData(metadata.data);
        await setLoading(false);
    };

    const fetchPost = async () => {
        const likeCount = await publicClient.readContract({
            address: SOCIAL_HUB_CONTRACT,
            abi: socialHubAbi,
            functionName: 'likeCount',
            args: [post.postNo],
        });  
        await setTotalLike(Number(likeCount));

        const dislikeCount = await publicClient.readContract({
            address: SOCIAL_HUB_CONTRACT,
            abi: socialHubAbi,
            functionName: 'dislikeCount',
            args: [post.postNo]
        });
        await setTotalDislike(Number(dislikeCount));

        const tipCount = await publicClient.readContract({
            address: SOCIAL_HUB_CONTRACT,
            abi: socialHubAbi,
            functionName: 'tipCount',
            args: [post.postNo],
        });  
        await setTotalTip(Number(tipCount)/ 10 ** 18);

        const isTokenized = await publicClient.readContract({
            address: SOCIAL_HUB_CONTRACT,
            abi: socialHubAbi,
            functionName: 'getIsTokenized',
            args: [post.postNo]
        });
        await setIsTokenized(isTokenized);

        if(isTokenized) {
            const nft = await publicClient.readContract({
                address: SOCIAL_HUB_CONTRACT,
                abi: socialHubAbi,
                functionName: 'getNFT',
                args: [post.postNo]
            });
            await setNFT(nft);

            const totalMint = await publicClient.readContract({
                address: nft,
                abi: nftAbi,
                functionName: 'totalSupply'
            });
            await setTotalMint(Number(totalMint));
        }
    };

    useEffect(() => {
        fetchMetadata().then(() => {
            fetchPost();
        });
    }, []);

    return (
        <>
            { !loading && metaData.comment.length > 0 &&
                <div key={post.postNo} className="w-full mt-3 mb-3">
                    <div>
                        <img src={IconUser} className="w-[50px] rounded-full inline-block" alt="profile" />
                        <span className="font-semibold text-lg ml-2">{post.profileHandle}</span>
                        {/* <span className="ml-2 text-sm cursor-pointer">subscribe</span> */}
                    </div>
                    <div className="mb-3">
                        <span className="text-2xl">
                            {metaData.comment}
                        </span>
                        { metaData.image.length > 0 && 
                            <>
                                <img src={metaData.image} alt="post" className="w-1/3 mt-1 mx-auto"/>
                            </>
                        }
                    </div>
                    <button onClick={ async ()=>{ await switchNetwork?.(BSC_CHAIN_ID); await handleLike(post.postNo); }} className="cursor-pointer font-semibold mr-2 bg-white">
                        {totalLike} Like
                    </button>
                    <button onClick={ async ()=>{ await switchNetwork?.(BSC_CHAIN_ID); await handleDislike(post.postNo); }} className="cursor-pointer font-semibold mr-2 bg-white">
                        {totalDislike} Dislike
                    </button>
                    { handle !== post.profileHandle &&
                        <button onClick={ async ()=>{ await switchNetwork?.(BSC_CHAIN_ID); await handleTip(post.postNo, 50 * 10 ** 18); }} className="cursor-pointer ml-2 mr-2 font-semibold bg-white">$50 Tip | Total: ${totalTip.toLocaleString()}</button>
                    }
                    { handle === post.profileHandle && !isTokenized &&
                        <button onClick={ async ()=>{ await switchNetwork?.(BSC_CHAIN_ID); await handleTokenize(post.postNo, 100, 1000); }} className="cursor-pointer ml-2 font-semibold bg-white">Tokenize to NFT</button>
                    }
                    { handle === post.profileHandle && isTokenized &&
                        <button className="ml-2 font-semibold bg-white">Already {totalMint}/1,000 Mint</button>
                    }
                    { handle !== post.profileHandle && isTokenized &&
                        <button onClick={ async ()=>{ await switchNetwork?.(BSC_CHAIN_ID); await handleMintNFT(post.postNo, 100); }} className="cursor-pointer ml-2 mr-2 font-semibold bg-white">{totalMint}/1,000 Mint</button>
                    }
                    <hr className="mt-3 w-full border border-black"/>
                </div>
            }
        </>
    )
};