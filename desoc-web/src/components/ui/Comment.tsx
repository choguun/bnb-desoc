// Comment.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { client, selectSp } from '@/client';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import { useAccount } from 'wagmi';
import { ReedSolomon } from '@bnb-chain/reed-solomon';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { BSC_CHAIN_ID, GF_CHAIN_ID, BUCKET_BASE_URI, BSC_RPC_URL, PROFILE_HANDLE_CONTRACT, SOCIAL_HUB_CONTRACT } from '@/env';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useWalletClient } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'wagmi/chains';
import useHandle from '@/hooks/useHandle';
import { profileHandleAbi } from '@/utils/profileHandleAbi';
import { socialHubAbi } from '@/utils/socialHubAbi';
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

export const Comment = () => {
    const { address, connector } = useAccount();
    const { handle } = useHandle();
    const { chain } = useNetwork();
    const { switchNetwork } = useSwitchNetwork();
    const { data: walletClient } = useWalletClient();
    const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(BSC_RPC_URL)
    });

    const userName = handle;
    const bucketName = `oasis-desoc-${userName}`;
    const bucketBaseURI = `${BUCKET_BASE_URI}/${bucketName}`;

    const [info, setInfo] = useState<{
      bucketName: string;
      objectName: string;
      file: File | null;
    }>({
      bucketName: '',
      objectName: '',
      file: null
    });
    const [commentData, setCommentData] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploadURI, setUploadURI] = useState('');
    const [uploadFinished, setUploadFinished] = useState(false);
    const [modalIsOpen, setIsOpen] = useState(false);

    const createPost = async (contentURI: any) => {
        const loading = toast.loading('Create Post...');
    
        try{
            const tokenId = await publicClient.readContract({
                address: PROFILE_HANDLE_CONTRACT,
                abi: profileHandleAbi,
                functionName: 'tokenOfOwnerByIndex',
                args: [address as `0x${string}`, BigInt(0)],
            });

            const { request } = await publicClient.simulateContract({
                account: address,
                address: SOCIAL_HUB_CONTRACT,
                abi: socialHubAbi,
                functionName: 'createPost',
                args: [tokenId, contentURI],
            });
            const txn = await walletClient!.writeContract(request);
            toast(txn);

            const result = await publicClient.waitForTransactionReceipt({ hash: txn })
            if (result.status === "success") {
                toast.success('Post Success');
                closeModal();
                window.location.reload();
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            toast.dismiss(loading);
            closeModal();
        }
    };

    const createObject = async (info: any) => {
        await setUploadFinished(false);
        const toastId1 = toast.loading('Create Object...');
        try {
            if (!address || !info.file) return;
    
            const spInfo = await selectSp();
    
            const provider = await connector?.getProvider();
            const offChainData = await getOffchainAuthKeys(address, provider);
            if (!offChainData) {
                toast('No offchain, please create offchain pairs first');
                return;
            }
    
            const rs = new ReedSolomon();
            const fileBytes = await info.file.arrayBuffer();
            const expectCheckSums = rs.encode(new Uint8Array(fileBytes));
            info.objectName = uuidv4();

            const createObjectTx = await client.object.createObject(
                {
                    bucketName: `${info.bucketName}`,
                    objectName: `${userName}/${info.objectName}`,
                    creator: address,
                    visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
                    fileType: info.file.type,
                    redundancyType: 'REDUNDANCY_EC_TYPE',
                    contentLength: fileBytes.byteLength,
                    expectCheckSums: expectCheckSums,
                },
                {
                    type: 'EDDSA',
                    domain: window.location.origin,
                    seed: offChainData.seedString,
                    address,
                },
            );

            const simulateInfo = await createObjectTx.simulate({
                denom: 'BNB',
            });

            const res = await createObjectTx.broadcast({
                denom: 'BNB',
                gasLimit: Number(simulateInfo?.gasLimit),
                gasPrice: simulateInfo?.gasPrice || '5000000000',
                payer: address,
                granter: '',
            });

            if (res.code === 0) {
                toast.success('create object success');
                const toastId2 = toast.loading('Upload Object...');

                try {
                    const uploadRes = await client.object.uploadObject(
                        {
                            bucketName: `${info.bucketName}`,
                            objectName: `${userName}/${info.objectName}`,
                            body: info.file,
                            txnHash: res.transactionHash,
                        },
                        {
                            type: 'EDDSA',
                            domain: window.location.origin,
                            seed: offChainData.seedString,
                            address,
                        },
                    );
            
                    if (uploadRes.code === 0) {
                        const uploadURI = `${bucketBaseURI}/${userName}/${info.objectName}`;
                        toast.success('upload object success');
                        return uploadURI;
                    }
                } catch (err) {
                    toast.error('Try again');
                    if (err instanceof Error) {
                        toast.error(err.message);
                    }
                } finally {
                    toast.dismiss(toastId2);
                    toast.dismiss(toastId1);
                }
            }
        } catch (err) {
            if (err instanceof Error) {
                toast.error('Try again');
                toast.error(err.message);
            }
        } finally {
            toast.dismiss(toastId1);
        }
    };

    const packCommentDatatoMetadata = async () => {
        if(commentData.length === 0){
            toast.error('Comment is empty');
            return;
        }

        try {
            let uploadURI = '';
            if(file) {
                const tempInfo = {
                    ...info,
                    file: file
                };
                uploadURI = await createObject(tempInfo) || ''; 
            }

            const jsonData = {
                comment: commentData,
                userName: userName,
                image: uploadURI
            };
            const jsonString = JSON.stringify(jsonData);
            const blob = new Blob([jsonString], { type: 'application/json' });

            const tempInfo = {
                ...info,
                file: blob as File
            };
            const finalUpload = await createObject(tempInfo);
            await setUploadURI(finalUpload || '');

            if(finalUpload !== undefined && finalUpload!.length > 0) {
                await setUploadFinished(true);
            }
        } catch (e) {
            console.log(e);
            toast.error(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const openModal = () => {
        setIsOpen(true);
    };
    
    const closeModal = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if(bucketName.length > 0) {
            setInfo({ ...info, bucketName: bucketName });
        }
    }, [bucketName]);

    useEffect(() => {
        if(uploadFinished) {
            switchNetwork?.(BSC_CHAIN_ID);
        }
    }, [uploadFinished]);

    useEffect(() => {
        if(uploadURI.length > 0 && chain?.id === BSC_CHAIN_ID && uploadFinished) {
            openModal();
        }
    }, [uploadURI, chain, uploadFinished]);

    return (
        <form action="#" className="relative">
          <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <textarea
              rows={5}
              name="description"
              id="description"
              className="p-2 block w-full resize-none border-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              placeholder="Write a description..."
              value={commentData}
              onChange={(e) => setCommentData(e.target.value)}
            />
    
            {/* Spacer element to match the height of the toolbar */}
            <div aria-hidden="true">
              <div className="py-2">
                <div className="h-9" />
              </div>
              <div className="h-px" />
              <div className="py-2">
                <div className="py-px">
                  <div className="h-1" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-px bottom-0">
            {/* Actions: These are just examples to demonstrate the concept, replace/wire these up however makes sense for your project. */}
            <div className="flex items-center justify-between space-x-3 border-t border-gray-200 px-2 py-2 sm:px-3">
              <div className="flex">
                <input className="custom-file-input file-input" type="file" accept="image/*" onChange={ async (e) => {
                    if (e.target.files) {
                        await setFile(e.target.files[0])
                    }
                }} />
              </div>
              <div className="flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={ async ()=>{
                    await switchNetwork?.(GF_CHAIN_ID); 
                    await packCommentDatatoMetadata();
                  }}>
                  Create Post
                </button>
              </div>
            </div>
          </div>
          <Modal
            isOpen={modalIsOpen}
            style={customStyles}
            contentLabel="Confirm Transaction"
          >
            <div className="text-xl font-semibold text-center">Confirm Posting...</div>
            <Loading type={'spin'} color={'#000'} />
            <button className="w-full bg-purple-500 mt-5" onClick={ async ()=> { await switchNetwork?.(BSC_CHAIN_ID); await createPost(uploadURI); }}>Confirm</button>
          </Modal>
        </form>
    )
};