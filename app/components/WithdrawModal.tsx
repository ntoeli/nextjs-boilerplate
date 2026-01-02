'use client';

import { useState, useContext } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { WalletContext } from './WalletProvider';

export const WithdrawModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { tronWeb, account } = useContext(WalletContext);
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [txId, setTxId] = useState('');

    const handleWithdraw = async () => {
        if (!tronWeb || !account) return alert('Connect wallet first!');
        try {
            const transaction = await tronWeb.transactionBuilder.sendTrx(recipient, tronWeb.toSun(amount), account);
            const signedTx = await tronWeb.trx.sign(transaction);
            const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            setTxId(broadcastTx.transaction.txID);
            alert(`Withdraw initiated! Tx ID: ${broadcastTx.transaction.txID}`);
            onClose();
        } catch (error) {
            alert('Withdraw failed.');
            console.error(error);
        }
    };

    return (
        <Transition show={isOpen}>
            <Dialog onClose={onClose} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-gray-800 p-6 rounded-lg text-white">
                        <Dialog.Title>Withdraw TRX</Dialog.Title>
                        <input type="text" placeholder="Recipient Address" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="border p-2 mb-2 w-full bg-gray-700" />
                        <input type="number" placeholder="Amount in TRX" value={amount} onChange={(e) => setAmount(e.target.value)} className="border p-2 mb-2 w-full bg-gray-700" />
                        <button onClick={handleWithdraw} className="bg-red-500 px-4 py-2 rounded">Confirm Withdraw</button>
                        {txId && <p>Tx ID: {txId}</p>}
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
};