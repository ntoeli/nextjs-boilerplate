'use client';

import { useContext } from 'react';
import { WalletContext } from './components/WalletProvider';

export default function Home() {
  const { isConnected, connectWallet, isLoading } = useContext(WalletContext);

  if (isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Connected! Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold">Game Arena</h1>
      <p className="text-xl">Demenci Gaming Platform</p>
      <button
        onClick={connectWallet}
        disabled={isLoading}
        className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-lg text-2xl font-semibold"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>

    </div>
  );
}