'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Trophy, Wallet as WalletIcon, ArrowDownCircle, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { WalletContext } from '../components/WalletProvider';
import { JoinGameButton } from '../components/JoinGameButton';

interface Transaction {
    no: number;
    type: string;
    amount: number;
    status: string;
    txId: string;
    timestamp: string;
}

export default function DashboardPage() {
    const { account, isConnected, tronWeb, disconnectWallet } = useContext(WalletContext);
    const router = useRouter();

    const [balanceTRX, setBalanceTRX] = useState(0);
    const [balanceUSD, setBalanceUSD] = useState(0);
    const [depositSumUSD, setDepositSumUSD] = useState(20.50);
    const [depositPercent, setDepositPercent] = useState(-12);
    const [withdrawSumUSD, setWithdrawSumUSD] = useState(240.50);
    const [withdrawPercent, setWithdrawPercent] = useState(12);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [trxPrice, setTrxPrice] = useState(0.286); // Current price Jan 02, 2026
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isConnected) {
            router.push('/');
            return;
        }

        // Fetch live TRX price
        const fetchPrice = async () => {
            try {
                const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
                const data = await res.json();
                setTrxPrice(data.tron.usd);
            } catch (e) {
                console.error('Price fetch failed');
            }
        };

        fetchPrice();
    }, [isConnected, router]);

    useEffect(() => {
        if (!tronWeb || !account) return;

        const fetchBalanceAndTxs = async () => {
            // Balance
            const bal = await tronWeb.trx.getBalance(account);
            const trx = bal / 1_000_000;
            setBalanceTRX(trx);
            setBalanceUSD(trx * trxPrice);

            // Transactions (last 50 for calculations)
            const res = await fetch(`https://api.shasta.trongrid.io/v1/accounts/${account}/transactions?limit=50&only_confirmed=true`);
            const data = await res.json();
            const txs = data.data || [];

            let depositTotal = 0;
            let withdrawTotal = 0;

            const processedTxs: Transaction[] = txs.slice(0, 10).map((tx: any, index: number) => {
                const contract = tx.raw_data.contract[0];
                if (contract.type !== 'TransferContract') return null;

                const { amount, owner_address, to_address } = contract.parameter.value;
                const trxAmount = amount / 1_000_000;
                const isOutgoing = owner_address === account;
                const status = tx.ret[0].contractRet === 'SUCCESS' ? 'Completed' : 'Failed';
                const timestamp = new Date(tx.raw_data.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                const type = isOutgoing
                    ? (trxAmount < 50 ? 'Entry Fee' : 'Withdraw')
                    : (trxAmount > 100 ? 'Prize' : 'Deposit');

                if (!isOutgoing) depositTotal += trxAmount * trxPrice;
                else withdrawTotal += trxAmount * trxPrice;

                return {
                    no: index + 1,
                    type,
                    amount: isOutgoing ? -trxAmount : trxAmount,
                    status,
                    txId: tx.txID.substring(0, 10) + '...',
                    timestamp,
                };
            }).filter(Boolean);

            setTransactions(processedTxs);
            setDepositSumUSD(depositTotal);
            setWithdrawSumUSD(withdrawTotal);
            // Percentages can be enhanced with historical comparison if needed
        };

        fetchBalanceAndTxs();
        const interval = setInterval(fetchBalanceAndTxs, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [tronWeb, account, trxPrice]);

    const handleCopy = () => {
        navigator.clipboard.writeText(account || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Welcome & Profile */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back!</h1>
                    <p className="text-gray-400">Here's your Game Arena overview</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                    <div className="bg-purple-600 rounded-full p-3">
                        <WalletIcon size={32} />
                    </div>
                    <div>
                        <p className="font-semibold">Janintal Sui</p>
                        <p className="text-sm text-gray-400">#202501</p>
                    </div>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <h2 className="text-lg text-gray-400">Total Balance (USD)</h2>
                    <p className="text-4xl font-bold">${balanceUSD.toFixed(2)}</p>
                    <p className="text-sm text-green-500">+12% from last week</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <h2 className="text-lg text-gray-400">Total Deposit (USD)</h2>
                    <p className="text-3xl font-bold">${depositSumUSD.toFixed(2)}</p>
                    <p className="text-sm text-red-500">{depositPercent}% from last month</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <h2 className="text-lg text-gray-400">Total Withdraw (USD)</h2>
                    <p className="text-3xl font-bold">${withdrawSumUSD.toFixed(2)}</p>
                    <p className="text-sm text-green-500">+{withdrawPercent}% from last month</p>
                </div>
            </div>

            {/* Recent Transactions & Deposit QR */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                                <th className="text-left py-2">No</th>
                                <th className="text-left py-2">Type</th>
                                <th className="text-left py-2">Amount</th>
                                <th className="text-left py-2">Status</th>
                                <th className="text-left py-2">Tx ID</th>
                                <th className="text-left py-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No transactions yet</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.no} className="border-b border-gray-700">
                                        <td className="py-3">{tx.no}</td>
                                        <td className="py-3">{tx.type}</td>
                                        <td className={`py-3 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} TRX
                                        </td>
                                        <td className={`py-3 ${tx.status === 'Completed' ? 'text-green-500' : 'text-red-500'}`}>
                                            {tx.status}
                                        </td>
                                        <td className="py-3">{tx.txId}</td>
                                        <td className="py-3">{tx.timestamp}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Quick Deposit</h2>
                    <p className="text-sm text-gray-400 mb-4">TRON (TRX) - TRC-20 Network</p>
                    <div className="bg-white p-4 rounded inline-block mb-4">
                        <QRCode value={account || ''} size={140} />
                    </div>
                    <p className="text-sm mb-2">Scan or copy address</p>
                    <div className="bg-gray-700 p-3 rounded flex items-center justify-between">
                        <span className="text-sm">{account?.substring(0, 8)}...{account?.substring(account.length - 8)}</span>
                        <button onClick={handleCopy} className="text-purple-400">
                            <Copy size={18} />
                        </button>
                    </div>
                    {copied && <p className="text-green-500 text-sm mt-2">Copied!</p>}
                    <div className="bg-yellow-600 text-black p-3 rounded mt-4 text-xs">
                        Warning: Only send TRX to this address. Other coins will be lost permanently.
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
                <button onClick={() => router.push('/wallet')} className="bg-purple-600 p-6 rounded-lg flex flex-col items-center gap-2 hover:bg-purple-700">
                    <WalletIcon size={32} />
                    <span className="font-semibold">My Wallet</span>
                </button>
                <button className="bg-blue-600 p-6 rounded-lg flex flex-col items-center gap-2 hover:bg-blue-700">
                    <Trophy size={32} />
                    <span className="font-semibold">My Matches</span>
                </button>
                <button className="bg-green-600 p-6 rounded-lg flex flex-col items-center gap-2 hover:bg-green-700">
                    <ArrowDownCircle size={32} />
                    <span className="font-semibold">Deposit</span>
                </button>
                <button className="bg-gray-700 p-6 rounded-lg flex flex-col items-center gap-2 hover:bg-gray-600">
                    <Download size={32} />
                    <span className="font-semibold">Download App</span>
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Featured Match: Pro Battle Royale</h3>
                <p className="text-gray-300 mb-6">Prize Pool: 500$ | Players: 87/100</p>
                <JoinGameButton
                    onSuccess={(txId) => {
                        // Optional: Send txId to your backend to register player
                        console.log('Player joined with tx:', txId);
                    }}
                />
            </div>
        </div>
    );
}