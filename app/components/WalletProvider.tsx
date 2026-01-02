'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import TronWeb from 'tronweb';

interface WalletContextType {
    tronWeb: any | null;
    account: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    isConnected: boolean;
    isLoading: boolean;
}

export const WalletContext = createContext<WalletContextType>({
    tronWeb: null,
    account: null,
    connectWallet: async () => { },
    disconnectWallet: () => { },
    isConnected: false,
    isLoading: false,
});


const FULL_NODE = process.env.NEXT_PUBLIC_FULL_NODE;
const SOLIDITY_NODE = process.env.NEXT_PUBLIC_SOLIDITY_NODE;
const EVENT_SERVER = process.env.NEXT_PUBLIC_EVENT_SERVER;

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tronWeb, setTronWeb] = useState<any | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {

        // Only initialize fallback TronWeb (no auto-connect)
        const initFallback = () => {
            const instance = new TronWeb({
                fullHost: FULL_NODE,
                solidityNode: SOLIDITY_NODE,
                eventServer: EVENT_SERVER,
            });
            setTronWeb(instance);
        };

        if (typeof window !== 'undefined' && window.tronLink) {
            // TronLink detected – but do NOT auto-request accounts
            setTronWeb(window.tronLink.tronWeb);
        } else {
            initFallback();
        }
    }, []);


    const connectWallet = async () => {
        if (!window.tronLink) {
            alert('Please install TronLink extension!');
            return;
        }

        setIsLoading(true);
        try {
            const res = await window.tronLink.request({
                method: 'tron_requestAccounts',
                params: {
                    websiteIcon: '/logo.png', // Optional: add your logo
                    websiteName: 'Game Arena',
                },
            });

            if (res.code === 200) {
                const address = window.tronLink.tronWeb.defaultAddress.base58;
                setAccount(address);
                setIsConnected(true);
                setTronWeb(window.tronLink.tronWeb);
                router.push('/dashboard'); // Auto-redirect on success
            } else if (res.code === 4001) {
                alert('Connection rejected by user.');
            } else {
                alert('Connection failed. Please try again.');
            }
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect wallet.');
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setIsConnected(false);
        setTronWeb(null);
        router.push('/'); // Redirect to home
        alert('Wallet disconnected successfully.');
    };

    return (
        <WalletContext.Provider value={{ tronWeb, account, connectWallet, disconnectWallet, isConnected, isLoading }}>
            {children}
        </WalletContext.Provider>
    );
};