/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Wallet } from '@rainbow-me/rainbowkit';
import { Chain, configureChains, mainnet } from 'wagmi';
import { bscTestnet } from 'wagmi/chains'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { publicProvider } from 'wagmi/providers/public';
import { GF_CHAIN_ID, GF_RPC_URL } from '@/env';

const greenFieldChain: Chain = {
  id: GF_CHAIN_ID,
  network: 'greenfield',
  rpcUrls: {
    default: {
      http: [GF_RPC_URL],
    },
    public: {
      http: [GF_RPC_URL],
    },
  },
  name: 'Greenfield Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    bscTestnet,
    {
      ...greenFieldChain,
      iconUrl:
        'https://github.com/wagmi-dev/wagmi/assets/5653652/44446c8c-5c72-4e89-b8eb-3042ef618eed',
    }
  ],
  [publicProvider()],
);

const coinbaseWalletConnector = new CoinbaseWalletConnector({
  chains,
  options: {
    appName: 'wagmi',
  },
});

const trustWalletConnector = new InjectedConnector({
  chains,
  options: {
    name: 'GN',
    shimDisconnect: true,
    // TODO: rainbowkit conflict
    getProvider: () => (typeof window !== 'undefined' ? (window as any).trustwallet : undefined),
  },
});

const metaMaskWalletConnector = new MetaMaskConnector({ chains });

export interface MyWalletOptions {
  projectId: string;
  chains: Chain[];
}

const RainbowTrustWalletConnector = (): Wallet => ({
  id: '_trust-wallet',
  name: 'Trust Wallet',
  iconUrl: 'https://my-image.xyz',
  iconBackground: '#0c2f78',
  downloadUrls: {
    android: 'https://play.google.com/store/apps/details?id=my.wallet',
    ios: 'https://apps.apple.com/us/app/my-wallet',
    chrome: 'https://chrome.google.com/webstore/detail/my-wallet',
    qrCode: 'https://my-wallet/qr',
  },
  createConnector: () => {
    return {
      connector: trustWalletConnector,
    };
  },
});

export {
  chains, coinbaseWalletConnector, metaMaskWalletConnector, publicClient, RainbowTrustWalletConnector, trustWalletConnector, webSocketPublicClient
};

