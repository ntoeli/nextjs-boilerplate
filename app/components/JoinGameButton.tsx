'use client';

import { useContext, useState } from 'react';
import { WalletContext } from './WalletProvider';
import toast from 'react-hot-toast';

interface JoinGameButtonProps {
    gameId?: string;
    onSuccess?: (response: any) => void;
}

export const JoinGameButton: React.FC<JoinGameButtonProps> = ({ gameId, onSuccess }) => {
    const { tronWeb, account, isConnected } = useContext(WalletContext);
    const [loading, setLoading] = useState(false);

    const ENTRY_FEE_USD = 1; //process.env.NEXT_PUBLIC_ENTRY_FEE_RECIPIENT;
    const RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_ENTRY_FEE_RECIPIENT;
    const TRONGRID_API_KEY = process.env.NEXT_PUBLIC_TRONGRID_API_KEY;

    const handleJoin = async () => {
        if (!isConnected || !tronWeb || !account) {
            toast.error('Please connect your wallet first!');
            return;
        }

        if (!RECIPIENT_ADDRESS) {
            toast.error('Recipient address not configured. Contact admin.');
            return;
        }

        /*
        if (!TRONGRID_API_KEY) {
            toast.error('TronGrid API key missing. Transaction may fail due to rate limits.');
        }*/

        setLoading(true);

        try {
            /*
            // Set official API key for all requests (build, sign, broadcast)
            if (TRONGRID_API_KEY) {
                tronWeb.setHeader({ 'TRON-PRO-API-KEY': TRONGRID_API_KEY });
            }*/

            // Fetch live TRX price
            const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
            if (!priceRes.ok) throw new Error('Failed to fetch TRX price');
            const priceData = await priceRes.json();
            const trxPriceUSD = priceData.tron.usd; // Current ~$0.286 USD (as of January 02, 2026)

            /*
            if (typeof (ENTRY_FEE_USD) == "number") {
                const trxAmount = ENTRY_FEE_USD / trxPriceUSD; // ~3.50 TRX for $1
                const sunAmount = Math.round(trxAmount * 1_000_000); // Convert to SUN (integer required)

                // Build transaction
                const transaction = await tronWeb.transactionBuilder.sendTrx(
                    RECIPIENT_ADDRESS,
                    sunAmount,
                    account
                );

                // Sign transaction (TronLink handles securely)
                const signedTx = await tronWeb.trx.sign(transaction);

                // Broadcast transaction
                const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);

                if (broadcastTx.result && broadcastTx.txid) {
                    const txId = broadcastTx.txid;

                    toast.success('Entry fee paid! You have joined the game!');

                    const successResponse = {
                        success: true,
                        message: 'Entry fee of $1 paid successfully',
                        transactionId: txId,
                        amountTRX: (sunAmount / 1_000_000).toFixed(6),
                        amountUSD: ENTRY_FEE_USD,
                        explorerUrl: `https://shasta.tronscan.org/#/transaction/${txId}`,
                        timestamp: new Date().toISOString(),
                    };

                    console.log('Payment Success JSON:', successResponse);

                    if (onSuccess) onSuccess(successResponse);

                    // New "Entry Fee" transaction will auto-appear in Recent panel within ~30s
                } else {
                    throw new Error(broadcastTx.message || 'Broadcast failed');
                }
            }*/

            const trxAmount = ENTRY_FEE_USD / trxPriceUSD; // ~3.50 TRX for $1
            const sunAmount = Math.round(trxAmount * 1_000_000); // Convert to SUN (integer required)

            // Build transaction
            const transaction = await tronWeb.transactionBuilder.sendTrx(
                RECIPIENT_ADDRESS,
                sunAmount,
                account
            );

            // Sign transaction (TronLink handles securely)
            const signedTx = await tronWeb.trx.sign(transaction);

            // Broadcast transaction
            const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);

            if (broadcastTx.result && broadcastTx.txid) {
                const txId = broadcastTx.txid;

                toast.success('Entry fee paid! You have joined the game!');

                const successResponse = {
                    success: true,
                    message: 'Entry fee of $1 paid successfully',
                    transactionId: txId,
                    amountTRX: (sunAmount / 1_000_000).toFixed(6),
                    amountUSD: ENTRY_FEE_USD,
                    explorerUrl: `https://shasta.tronscan.org/#/transaction/${txId}`,
                    timestamp: new Date().toISOString(),
                };

                console.log('Payment Success JSON:', successResponse);

                if (onSuccess) onSuccess(successResponse);

                // New "Entry Fee" transaction will auto-appear in Recent panel within ~30s
            } else {
                throw new Error(broadcastTx.message || 'Broadcast failed');
            }
        } catch (error: any) {
            console.error('Entry fee payment failed:', error);
            let msg = 'Payment failed';
            if (error.message?.includes('balance is not sufficient')) {
                msg = 'Insufficient TRX balance';
            } else if (error.message?.includes('rejected')) {
                msg = 'Transaction rejected in wallet';
            }
            toast.error(msg + '. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleJoin}
            disabled={loading || !isConnected}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-3 px-8 rounded-lg transition"
        >
            {loading ? 'Processing Payment...' : 'Join - Entry Fee $1'}
        </button>
    );
};