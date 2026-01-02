'use client';

import { useContext } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { WalletContext } from './WalletProvider';

export const Header = () => {
    const { account, isConnected, isLoading, connectWallet, disconnectWallet } = useContext(WalletContext);

    return (
        <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Game Arena</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search matches, players or rooms..."
                        className="bg-gray-800 pl-10 pr-4 py-2 rounded-lg w-64"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                {isConnected ? (
                    <>
                        <span className="text-sm bg-gray-800 px-3 py-1 rounded">
                            {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
                        </span>
                        <button
                            onClick={disconnectWallet}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center gap-2"
                        >
                            Disconnect Wallet
                        </button>
                    </>
                ) : (
                    <button
                        onClick={connectWallet}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                    >
                        {isLoading ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                )}
                <Bell size={20} />
                <User size={20} />
            </div>
        </header>
    );
};