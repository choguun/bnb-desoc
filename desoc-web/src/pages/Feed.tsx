import '@rainbow-me/rainbowkit/styles.css';
import { useAccount } from 'wagmi';
import { Feed } from '@/components/feed';
import { Wallet } from '@/components/wallet';

function FeedPage() {
  const {isConnected} = useAccount();
  
  return (
    <>
      <Wallet />
      {isConnected && <Feed /> }
    </>
  )
}

export default FeedPage
