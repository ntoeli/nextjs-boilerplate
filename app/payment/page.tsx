'use client';

import React, { useContext, useState } from 'react';
import { WalletContext } from '../components/WalletProvider';

export default function PaymentPage() {
    const { account, connectWallet, isConnected, tronWeb } = useContext(WalletContext);
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [txId, setTxId] = useState('');

    const handlePayment = async () => {
        if (!tronWeb || !account) return alert('Connect wallet first!');

        try {
            const transaction = await tronWeb.transactionBuilder.sendTrx(
                recipient,
                tronWeb.toSun(amount),  // Convert TRX to SUN (1 TRX = 1e6 SUN)
                account
            );
            const signedTx = await tronWeb.trx.sign(transaction);
            const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            setTxId(broadcastTx.txid);
            alert(`Transaction sent! ID: ${broadcastTx.txid}`);
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed.');
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl mb-4">TRON Payment Integration</h1>
            {!isConnected ? (
                <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Connect TronLink Wallet
                </button>
            ) : (
                <div>
                    <p>Connected Account: {account}</p>
                    <input
                        type="text"
                        placeholder="Recipient Address"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="border p-2 mb-2"
                    />
                    <input
                        type="number"
                        placeholder="Amount in TRX"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border p-2 mb-2"
                    />
                    <button onClick={handlePayment} className="bg-green-500 text-white px-4 py-2 rounded">
                        Send Payment
                    </button>
                    {txId && <p>Tx ID: <a href={`https://tronscan.org/#/transaction/${txId}`} target="_blank">{txId}</a></p>}
                </div>
            )}
        </div>
    );
}