import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import '@/App.css';
import { Landing } from '@/components/landing';
import { Wallet } from '@/components/wallet';
import LogoOasis from '@/assets/dataoasis_logo.jpeg';

function App() {
  const {isConnected} = useAccount();
  
  return (
    <>
      <Wallet />
      {!isConnected && 
      <>
        <div className="flex flex-col items-center bg-blue-200 h-screen">
          <div className="w-1/2 text-center flex items-center flex-col">
            <img src={LogoOasis} className="mt-5 mb-5" alt="Data Oasis" width={150} />
            <ConnectButton accountStatus="address" />
            <span className="mt-1 text-md font-semibold">Connect Wallet to get in to <b>Data Oasis</b></span>
          </div>
        </div>
      </>
      }
      {isConnected && <Landing /> }
    </>
  )
}

export default App
