'use client';

import { useEffect, useState } from 'react';
import { Copy, Edit, Wallet as WalletIcon, ArrowDownCircle, Download, User } from 'lucide-react';
import QRCode from 'react-qr-code';
import { WalletContext } from '../components/WalletProvider';
import { WithdrawModal } from '../components/WithdrawModal';

interface Transaction {
    no: number;
    type: string;
    amount: number;
    status: string;
    txId: string;
    timestamp: string;
}

export default function WalletPage() {
    const { tronWeb, account, connectWallet, isConnected } = useContext(WalletContext);
    const [balance, setBalance] = useState(0);
    const [price, setPrice] = useState(0.285); // Default; fetched below
    const [balancePercent, setBalancePercent] = useState(12);
    const [depositSum, setDepositSum] = useState(20.5);
    const [depositPercent, setDepositPercent] = useState(-12);
    const [withdrawSum, setWithdrawSum] = useState(240.5);
    const [withdrawPercent, setWithdrawPercent] = useState(12);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchPrice = async () => {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
            const data = await res.json();
            setPrice(data.tron.usd);
        };

        const fetchHistorical = async (days: number) => {
            const res = await fetch(`https://api.coingecko.com/api/v3/coins/tron/market_chart?vs_currency=usd&days=${days}`);
            const data = await res.json();
            return data.prices;
        };

        const calculatePercents = async () => {
            const weekPrices = await fetchHistorical(7);
            const monthPrices = await fetchHistorical(30);
            const price7ago = weekPrices[0][1];
            const current = weekPrices[weekPrices.length - 1][1];
            setBalancePercent(((current - price7ago) / price7ago) * 100);

            // For deposit/withdraw, use transaction sums (below)
        };

        fetchPrice();
        calculatePercents();
    }, []);

    useEffect(() => {
        if (!tronWeb || !account) return;

        const fetchBalance = async () => {
            const bal = await tronWeb.trx.getBalance(account);
            setBalance(bal / 1_000_000); // SUN to TRX
        };

        const fetchTransactions = async () => {
            const res = await tronWeb.fullNode.request(`/v1/accounts/${account}/transactions?limit=200&only_confirmed=true`);
            const txs = res.data || [];

            let depositTotal = 0;
            let withdrawTotal = 0;
            let depositLastMonth = 0;
            let depositPrevMonth = 0;
            let withdrawLastMonth = 0;
            let withdrawPrevMonth = 0;

            const now = new Date();
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).getTime();
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime();
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0).getTime();

            const processedTxs: Transaction[] = txs.map((tx: any, index: number) => {
                const contract = tx.raw_data.contract[0];
                if (contract.type !== 'TransferContract') return null; // Only TRX transfers

                const { amount, owner_address, to_address } = contract.parameter.value;
                const trxAmount = amount / 1_000_000;
                const isOutgoing = owner_address === account;
                const status = tx.ret[0].contractRet === 'SUCCESS' ? 'Completed' : 'Failed';
                const timestamp = new Date(tx.raw_data.timestamp).toLocaleString();
                const type = isOutgoing
                    ? (trxAmount < 100 ? 'Entry Fee' : 'Withdraw')
                    : (trxAmount > 100 ? 'Prize' : 'Deposit');

                // Sum totals
                if (!isOutgoing) depositTotal += trxAmount;
                else withdrawTotal += trxAmount;

                // Sum for periods (in USD)
                const txTime = tx.raw_data.timestamp;
                const usdAmount = trxAmount * price;
                if (txTime >= lastMonthStart && txTime <= lastMonthEnd) {
                    if (!isOutgoing) depositLastMonth += usdAmount;
                    else withdrawLastMonth += usdAmount;
                } else if (txTime >= prevMonthStart && txTime <= prevMonthEnd) {
                    if (!isOutgoing) depositPrevMonth += usdAmount;
                    else withdrawPrevMonth += usdAmount;
                }

                return {
                    no: index + 1,
                    type,
                    amount: isOutgoing ? -trxAmount : trxAmount,
                    status,
                    txId: tx.txID.substring(0, 10) + '...',
                    timestamp,
                };
            }).filter(Boolean).slice(0, 10); // Top 10 recent

            setTransactions(processedTxs);
            setDepositSum(depositTotal * price);
            setWithdrawSum(withdrawTotal * price);
            const depChange = depositPrevMonth > 0 ? ((depositLastMonth - depositPrevMonth) / depositPrevMonth) * 100 : 0;
            setDepositPercent(depChange);
            const wdChange = withdrawPrevMonth > 0 ? ((withdrawLastMonth - withdrawPrevMonth) / withdrawPrevMonth) * 100 : 0;
            setWithdrawPercent(wdChange);
        };

        fetchBalance();
        fetchTransactions();
    }, [tronWeb, account, price]);

    const handleCopy = () => {
        navigator.clipboard.writeText(account || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <button onClick={connectWallet} className="bg-purple-600 px-6 py-3 rounded-lg">Connect TronLink Wallet</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">My Wallet</h1>
                    <p className="text-gray-400">Manage your crypto assets, deposits, and view transaction history.</p>
                </div>
                <button onClick={() => setIsWithdrawOpen(true)} className="bg-gray-700 px-4 py-2 rounded flex items-center gap-2">
                    <WalletIcon size={18} /> Withdraw
                </button>
            </div>

            <div className="flex justify-between items-center mb-8">
                {/* existing h1 and withdraw button */}
                <button onClick={disconnectWallet} className="bg-red-600 px-4 py-2 rounded">
                    Disconnect Wallet
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-lg">Total Balance (USD)</h2>
                    <p className="text-3xl">${(balance * price).toFixed(2)}</p>
                    <p className={`text-sm ${balancePercent > 0 ? 'text-green-500' : 'text-red-500'}`}>{balancePercent.toFixed(0)}% from last week</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-lg">Total Deposit (USD)</h2>
                    <p className="text-3xl">${depositSum.toFixed(2)}</p>
                    <p className={`text-sm ${depositPercent > 0 ? 'text-green-500' : 'text-red-500'}`}>{depositPercent.toFixed(0)}% from last month</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-lg">Total Withdraw (USD)</h2>
                    <p className="text-3xl">${withdrawSum.toFixed(2)}</p>
                    <p className={`text-sm ${withdrawPercent > 0 ? 'text-green-500' : 'text-red-500'}`}>{withdrawPercent.toFixed(0)}% from last month</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between mb-4">
                        <h2 className="text-lg">Wallet History</h2>
                        <select className="bg-gray-700 p-2 rounded">
                            <option>All Assets</option>
                        </select>
                        <select className="bg-gray-700 p-2 rounded">
                            <option>All Types</option>
                        </select>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400">
                                <th>No</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Transaction ID</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.no}>
                                    <td>{tx.no}</td>
                                    <td>{tx.type}</td>
                                    <td className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>{tx.amount.toFixed(2)}</td>
                                    <td className={tx.status === 'Completed' ? 'text-green-500' : tx.status === 'Pending' ? 'text-yellow-500' : 'text-red-500'}>{tx.status}</td>
                                    <td>{tx.txId}</td>
                                    <td>{tx.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-lg mb-4">Deposit</h2>
                    <div className="space-y-2">
                        <p>Asset: TRON (TRX)</p>
                        <p>TRC-20 Network</p>
                        <div className="bg-white p-2 inline-block rounded">
                            <QRCode value={account || ''} size={128} />
                        </div>
                        <p className="text-sm">Scan QR code or copy address to deposit TRX</p>
                        <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                            <p>{account?.substring(0, 6)}...{account?.substring(account.length - 6)}</p>
                            <button onClick={handleCopy}><Copy size={16} /></button>
                            {copied && <span>Copied!</span>}
                        </div>
                        <div className="bg-yellow-600 p-2 rounded text-sm">
                            Only send TRX to this deposit address. Sending any other coin or token may result in permanent loss.
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <h2 className="text-lg mb-4">Quick Links</h2>
                    <div className="space-y-2">
                        <div className="bg-gray-800 p-2 rounded flex items-center gap-2"><Edit size={18} /> Edit Profile</div>
                        <div className="bg-gray-800 p-2 rounded flex items-center gap-2"><WalletIcon size={18} /> View Wallet Address</div>
                        <div className="bg-gray-800 p-2 rounded flex items-center gap-2"><ArrowDownCircle size={18} /> Deposit Assets</div>
                        <div className="bg-gray-800 p-2 rounded flex items-center gap-2"><Download size={18} /> Download Game App</div>
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                    <User size={32} className="bg-purple-600 rounded-full p-1" />
                    <div>
                        <p>Janintal Sui</p>
                        <p className="text-sm text-gray-400">#202501</p>
                    </div>
                </div>
            </div>

            <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} />
        </div>
    );
}