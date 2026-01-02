'use client';

import { LayoutDashboard, MonitorPlay, UserCircle, Trophy, Wallet, Shield } from 'lucide-react';

export const Sidebar = () => {
    return (
        <aside className="bg-gray-900 text-white w-64 p-4 flex flex-col gap-4">
            <nav>
                <ul className="space-y-2">
                    <li className="flex items-center gap-2"><LayoutDashboard size={20} /> Dashboard</li>
                    <li className="flex items-center gap-2"><MonitorPlay size={20} /> Live Review</li>
                    <li className="flex items-center gap-2"><UserCircle size={20} /> Manage Account</li>
                    <li className="flex items-center gap-2"><Trophy size={20} /> My Matches</li>
                    <li className="flex items-center gap-2 bg-purple-600 p-2 rounded"><Wallet size={20} /> Wallet</li>
                    <li className="flex items-center gap-2"><Shield size={20} /> Security</li>
                </ul>
            </nav>
        </aside>
    );
};