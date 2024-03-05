import '@rainbow-me/rainbowkit/styles.css';
import { useAccount } from 'wagmi';
import { Profile } from '@/components/profile';
import { Wallet } from '@/components/wallet';

function ProfilePage() {
  const {isConnected} = useAccount();
  
  return (
    <>
      <Wallet />
      {isConnected && <Profile /> }
    </>
  )
}

export default ProfilePage
