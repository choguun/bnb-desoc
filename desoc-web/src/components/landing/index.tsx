/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoOasis from '@/assets/dataoasis_logo.jpeg';
import { useAccount, useSwitchNetwork, useWalletClient } from 'wagmi';
import { parseUnits, createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains'
import { BSC_RPC_URL, PROFILE_HANDLE_CONTRACT, BSC_CHAIN_ID, REGISTRY_CONTRACT, TOKEN_CONTRACT } from '@/env';
import { profileHandleAbi } from '@/utils/profileHandleAbi';
import { registryAbi } from '@/utils/registryAbi';
import toast from 'react-hot-toast';
import useHandle from '@/hooks/useHandle';
import { client, selectSp } from '@/client';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import { GF_CHAIN_ID } from '@/env';
import Modal from 'react-modal';
import ReactLoading from 'react-loading';

const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '30%',
      height: '30%'
    },
};

const Loading = ({ type, color }: any) => (
    <ReactLoading className="mx-auto mt-3 mb-10" type={type} color={color} height={'15%'} width={'15%'} />
);

export const Landing = () => {
  const { address, connector, isConnected, isConnecting, isReconnecting } = useAccount();
  const navigate = useNavigate();
  const { data: walletClient } = useWalletClient();
  const { saveHandle, saveCurrentAddress } = useHandle();

  const [userName, setUserName] = useState('');
  const [handleName, setHandleName] = useState('');
  const { switchNetwork } = useSwitchNetwork();
  const [isSignup, setIsSignup] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [modalIsOpen, setIsOpen] = useState(false);

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(BSC_RPC_URL)
  });

  const createBucket = async () => {
    if (!address) return;

    const spInfo = await selectSp();
    const provider = await connector?.getProvider();
    const offChainData = await getOffchainAuthKeys(address, provider);
    if (!offChainData) {
      toast.error('No offchain, please create offchain pairs first');
      return;
    }

    try {
      const data = userName.length > 0 ? userName : handleName;
      const createBucketTx = await client.bucket.createBucket(
        {
          bucketName: `oasis-desoc-${data}`,
          creator: address,
          visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
          chargedReadQuota: '0',
          spInfo: {
            primarySpAddress: spInfo.primarySpAddress,
          },
          paymentAddress: address,
        },
        {
          type: 'EDDSA',
          domain: window.location.origin,
          seed: offChainData.seedString,
          address,
        },
      );

      const simulateInfo = await createBucketTx.simulate({
        denom: 'BNB',
      });

      const res = await createBucketTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: address,
        granter: '',
      });
      if (res.code === 0) {
        // alert('success');
        window.location.reload();
      }
    } catch (err) {
      console.log(typeof err);
      console.log(err);
      if (err instanceof Error) {
        alert(err.message);
      }
      if (err && typeof err ==='object') {
        alert(JSON.stringify(err))
      }
    }
  };

  const signUp = async () => {  
    const loading = toast.loading('Signing Up...');

    try{
      const { request } = await publicClient.simulateContract({
        account: address,
        address: PROFILE_HANDLE_CONTRACT,
        abi: profileHandleAbi,
        functionName: 'registerHandle',
        args: [userName],
        value: parseUnits('0.01', 18) ,
      });

      const txn = await walletClient!.writeContract(request);
      // toast.success('Sign Up Success');
      const result = await publicClient.waitForTransactionReceipt({ hash: txn });

      if (result.status === "success") {
        const tokenId = await publicClient.readContract({
          address: PROFILE_HANDLE_CONTRACT,
          abi: profileHandleAbi,
          functionName: 'tokenOfOwnerByIndex',
          args: [address as `0x${string}`, BigInt(0)],
        });

        const { request } = await publicClient.simulateContract({
          account: address,
          address: REGISTRY_CONTRACT,
          abi: registryAbi,
          functionName: 'createAccount',
          args: [REGISTRY_CONTRACT, BigInt(BSC_CHAIN_ID), PROFILE_HANDLE_CONTRACT, tokenId, BigInt(1), '0x']
        });
  
        const txn = await walletClient!.writeContract(request);
        toast.success('Sign Up Success');
        const result = await publicClient.waitForTransactionReceipt({ hash: txn });
  
        if (result.status === "success") {
          await switchNetwork?.(GF_CHAIN_ID);
          await setIsOnboarding(true);
        }
        // await createBucket();
        // window.location.reload();
      }
    } catch (e) {
      toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      toast.dismiss(loading);
      // window.location.reload();
    }
  };
  
  const signIn = async () => {
    navigate("/feed");
  };

  const getUserProfileHandle = async () => {
    const loading1 = toast.loading('Fetch Data...');
    try {
      const handleTokenAmount = await publicClient.readContract({
        address: PROFILE_HANDLE_CONTRACT,
        abi: profileHandleAbi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      if(Number(handleTokenAmount) > 0) {
        setIsSignup(true);

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
  
        setHandleName(handleName);
        saveHandle(handleName);
        saveCurrentAddress(address);
      }
      else
        setIsSignup(false);
    } catch (e) {
      toast(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      toast.dismiss(loading1);
    }
  };

  const handleUserNameChange = (e: any) => {
    setUserName(e.target.value);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const fetchBucketName = async () => {
    switchNetwork?.(GF_CHAIN_ID);
    try {
      const bucketInfo = await client.bucket.getBucketMeta({
        bucketName: `oasis-desoc-${handleName}`
      });
      if(bucketInfo.code !== 0) {
        openModal();
      }
    } catch(error) {
      openModal();
      console.log(error);
    }
  };

  useEffect(() => {
    // switchNetwork?.(BSC_CHAIN_ID);
    getUserProfileHandle();
  }, [address, isConnected, isConnecting, isReconnecting]);


  useEffect(() => {
    if(handleName.length > 0)
      fetchBucketName()
  }, [handleName]);

  useEffect(() => {
    if(isOnboarding) {
        openModal();
    }
}, [isOnboarding]);

  return (
    <div className="flex flex-col items-center bg-purple-200 h-screen">
        <div className="w-1/3 text-center">
          <img src={LogoOasis} className="mx-auto mt-10" alt="Data Oasis" width={250} />
          { !isSignup && 
            <>
              <div className="mt-4 text-black text-lg font-semibold">You did not sign in yet.<br/>Please sign up and choose Handle Name.</div>
              <input name="username" value={userName} onChange={handleUserNameChange} className="px-3 py-2 w-full mt-4 rounded-2xl border border-black text-center" type="text" placeholder="Handle Name" pattern="[A-Za-z0-9]+"></input>
              <button className="mt-2 w-full text-white rounded-2xl" onClick={ async ()=> { await switchNetwork?.(BSC_CHAIN_ID); await signUp(); }}>Sign up</button>
            </>
          }
          { isSignup &&
            <button className="mt-2 w-full text-white rounded-2xl" onClick={()=> signIn()}>Sign in with {handleName}</button>
          }
        </div>
        <Modal
            isOpen={modalIsOpen}
            style={customStyles}
            contentLabel="Confirm Transaction"
          >
            <div className="text-xl font-semibold text-center">Create Bucket...</div>
            <Loading type={'spin'} color={'#000'} />
            <button className="w-full bg-purple-500 mt-5" onClick={ async ()=> { await switchNetwork?.(GF_CHAIN_ID); await createBucket(); }}>Confirm</button>
          </Modal>
    </div>
  )
}
