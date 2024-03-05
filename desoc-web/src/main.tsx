import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.tsx';
import Feed from '@/pages/Feed.tsx';
import Profile from '@/pages/Profile.tsx';
import '@/index.css';
import { WagmiConfig, createConfig } from 'wagmi';
import { RainbowKitProvider, connectorsForWallets, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { chains, publicClient, webSocketPublicClient } from '@/config/wallet.ts';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const projectId = '9bf3510aab08be54d5181a126967ee71';
const { wallets } = getDefaultWallets({
  projectId,
  appName: 'greenfield js sdk demo',
  chains,
});

const connectors = connectorsForWallets([
  ...wallets,
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  webSocketPublicClient,
  publicClient,
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
  },
  {
    path: "/feed",
    element: <Feed/>,
  },
  {
    path : "/profile",
    element: <Profile/>
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider modalSize="compact" chains={chains}>
        <Toaster />
        <RouterProvider router={router} />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>,
)
