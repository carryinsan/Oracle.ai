```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Users, Key, AlertTriangle, CheckCircle, Ban, ArrowUpCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'users' | 'referrals'>('telemetry');
  const [telemetry, setTelemetry] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Referral Generator State
  const [refTier, setRefTier] = useState('plus');
  const [refEmail, setRefEmail] = useState('');
  const [refDuration, setRefDuration] = useState(30);
  const [generatedCode, setGeneratedCode] = useState('');

  // Fetch data on mount based on tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'telemetry') {
        const res = await fetch('/api/admin/usage');
        const data = await res.json();
        if (data.status === 'success') setTelemetry(data.data.telemetry);
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.status === 'success') setUsers(data.data);
      }
    } catch (e) {
      console.error('Admin Fetch Error:', e);
    }
    setLoading(false);
  };

  const handleGenerateReferral = async () => {
    const res = await fetch('/api/admin/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_tier: refTier,
        duration_days: refDuration,
        assigned_email: refEmail || null
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      setGeneratedCode(data.data.code);
    }
  };

  const handleUserAction = async (userId: string, action: string, newTier?: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, new_tier: newTier })
    });
    fetchData(); // Refresh list
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <ShieldCheck className="w-8 h-8 text-red-500" />
            Core System Command
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-mono">SOC2 COMPLIANT AUDIT INTERFACE • E2E ENCRYPTED</p>
        </div>
        <div className="flex bg-[#0a0f1a] rounded-lg p-1 border border-white/10">
          {['telemetry', 'users', 'referrals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 text-sm font-bold capitalize rounded-md transition-all ${
                activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-20 animate-pulse-slow">
            <Activity className="w-10 h-10 text-cyan-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* TELEMETRY DASHBOARD */}
            {activeTab === 'telemetry' && telemetry && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" /> Total Users</div>
                  <div className="text-4xl font-light text-white">{telemetry.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-emerald-400 mt-2">{telemetry.dailyActiveUsers.toLocaleString()} Active Today</div>
                </div>
                <div className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400" /> Token Burn</div>
                  <div className="text-4xl font-light text-white">{telemetry.totalTokens.toLocaleString()}</div>
                  <div className="text-sm text-slate-400 mt-2">Cumulative Generation Usage</div>
                </div>
                <div className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-lg">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Oracle & Sage Hits</div>
                  <div className="text-4xl font-light text-white">{telemetry.oracleUses.toLocaleString()}</div>
                  <div className="text-sm text-slate-400 mt-2">High-compute requests today</div>
                </div>
              </div>
            )}

            {/* USERS MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-400">
                      <th className="p-4 font-bold border-b border-white/10">User Email</th>
                      <th className="p-4 font-bold border-b border-white/10">Tier</th>
                      <th className="p-4 font-bold border-b border-white/10">Energy Balance</th>
                      <th className="p-4 font-bold border-b border-white/10">Status</th>
                      <th className="p-4 font-bold border-b border-white/10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                        <td className="p-4 text-slate-300 font-medium">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] rounded uppercase font-bold tracking-wider 
                            ${u.tier === 'elite' ? 'bg-purple-500/20 text-purple-400' : 
                              u.tier === 'pro' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {u.tier}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono">{u.ai_usage?.[0]?.energy_balance || 0}</td>
                        <td className="p-4">
                          {u.is_banned ? <span className="text-red-400 flex items-center gap-1"><Ban className="w-3 h-3"/> Banned</span> 
                                       : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span>}
                        </td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => handleUserAction(u.id, 'UPGRADE', 'elite')} className="p-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/30 rounded transition-colors" title="Upgrade to Elite"><ArrowUpCircle className="w-4 h-4" /></button>
                          <button onClick={() => handleUserAction(u.id, u.is_banned ? 'UNBAN' : 'BAN')} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/30 rounded transition-colors" title="Toggle Ban"><Ban className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REFERRAL ENGINE */}
            {activeTab === 'referrals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#0a0f1a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-lg">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Key className="w-5 h-5 text-amber-400" /> Access Code Generator</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Tier</label>
                      <select value={refTier} onChange={(e) => setRefTier(e.target.value)} className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500">
                        <option value="plus">Oracle Plus</option>
                        <option value="pro">Oracle Infinite (Pro)</option>
                        <option value="elite">Oracle Black (Elite)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign to Specific Email (Optional)</label>
                      <input type="email" value={refEmail} onChange={(e) => setRefEmail(e.target.value)} placeholder="user@domain.com" className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duration (Days)</label>
                      <input type="number" value={refDuration} onChange={(e) => setRefDuration(Number(e.target.value))} className="w-full bg-[#030712] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" />
                    </div>
                    <button onClick={handleGenerateReferral} className="w-full py-4 mt-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                      Generate Cryptographic Key
                    </button>
                  </div>

                  {generatedCode && (
                    <div className="mt-8 p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl text-center">
                      <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest mb-1">Code Minted Successfully</div>
                      <div className="text-2xl font-mono text-white select-all">{generatedCode}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

```
