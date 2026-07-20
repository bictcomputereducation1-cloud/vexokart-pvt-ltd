import React, { useEffect, useState } from 'react';
import { Wallet, Check, X, CreditCard, Clock, Search, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, paid, rejected
  const [search, setSearch] = useState('');

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payouts');
      if (!res.ok) throw new Error('Failed to load payouts');
      const data = await res.json();
      setPayouts(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch payouts from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleAction = async (payoutId: string, action: 'approve' | 'reject' | 'pay') => {
    try {
      const res = await fetch('/api/admin/payouts/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to process payout action');

      toast.success(result.message || `Payout request ${action}ed`);
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || `Failed to perform payout action: ${action}`);
    }
  };

  // Stats
  const totalPending = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalApproved = payouts
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayouts = payouts.filter(p => {
    const matchesStatus = filter === 'all' || p.status === filter;
    const matchesSearch = p.store_name?.toLowerCase().includes(search.toLowerCase()) || 
                          p.id?.toLowerCase().includes(search.toLowerCase()) || 
                          p.bank_name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-20 p-2">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">payout settlements</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Vendor Wallet Settlement & Verification Desk</p>
      </div>

      {/* Finance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#052b14] h-32 rounded-[2rem] border border-[#103d20] shadow-md p-6 relative overflow-hidden flex flex-col justify-between text-white">
          <div className="absolute right-0 top-0 opacity-10">
            <Clock className="h-32 w-32 rotate-12 text-white" />
          </div>
          <div>
            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest block mb-0.5">Pending Approvals</span>
            <span className="text-3xl font-black italic">₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-[10px] text-slate-300 font-bold">Awaiting verification</span>
        </div>

        <div className="bg-[#052b14] h-32 rounded-[2rem] border border-[#103d20] shadow-md p-6 relative overflow-hidden flex flex-col justify-between text-white">
          <div className="absolute right-0 top-0 opacity-10">
            <Wallet className="h-32 w-32 rotate-12 text-white" />
          </div>
          <div>
            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest block mb-0.5">Approved & Queued</span>
            <span className="text-3xl font-black italic">₹{totalApproved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-[10px] text-slate-300 font-bold">Awaiting final bank payout</span>
        </div>

        <div className="bg-[#052b14] h-32 rounded-[2rem] border border-[#103d20] shadow-md p-6 relative overflow-hidden flex flex-col justify-between text-white">
          <div className="absolute right-0 top-0 opacity-10">
            <CreditCard className="h-32 w-32 rotate-12 text-white" />
          </div>
          <div>
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Total Settled</span>
            <span className="text-3xl font-black italic">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-bold">Successfully paid out</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['all', 'pending', 'approved', 'paid', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === s 
                  ? 'bg-primary text-slate-900 border-2 border-primary shadow-sm' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-2 border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-2.5 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search vendor or bank..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-slate-800 text-xs h-10"
          />
        </div>
      </div>

      {/* Main Ledger list */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Withdrawal queue entries</h2>
          <span className="text-[10px] font-black text-slate-400 uppercase">{filteredPayouts.length} total entries</span>
        </div>

        {loading ? (
          <div className="py-20 text-center font-bold uppercase tracking-widest text-slate-400 text-xs">Loading payouts ledger...</div>
        ) : filteredPayouts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 border-2 border-dashed rounded-[2rem] m-6">
            <ShieldAlert className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-md font-bold text-slate-700 mb-1">No payout entries</h3>
            <p className="text-xs">No pending or historical payout requests match selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b">
                  <th className="px-6 py-4">Request ID & Date</th>
                  <th className="px-6 py-4">Store / Merchant</th>
                  <th className="px-6 py-4">Settlement Bank details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-mono text-xs font-black text-slate-800 uppercase tracking-tighter">#{p.id}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">
                        {p.requested_at ? new Date(p.requested_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '--'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        {p.store_name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase">V-ID: {p.vendor_id.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-semibold text-slate-800">{p.bank_name}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">A/C: {p.account_number}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-black italic text-slate-900">₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {/* Status Label */}
                        <div className="mr-2">
                          {p.status === 'pending' && (
                            <span className="text-[9px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-full px-2 py-0.5 uppercase">Pending</span>
                          )}
                          {p.status === 'approved' && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 uppercase">Queued</span>
                          )}
                          {p.status === 'paid' && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 uppercase">Settled</span>
                              {p.transaction_id && <p className="text-[8px] font-mono text-slate-400 uppercase leading-none mt-0.5">TXN: {p.transaction_id}</p>}
                            </div>
                          )}
                          {p.status === 'rejected' && (
                            <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 uppercase">Rejected</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(p.id, 'approve')}
                                className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 font-bold text-[9px] px-2.5 py-1.5 rounded-lg uppercase transition-all active:scale-[0.97]"
                                title="Approve Withdrawal"
                              >
                                <Check className="h-3 w-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleAction(p.id, 'reject')}
                                className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold text-[9px] px-2.5 py-1.5 rounded-lg uppercase transition-all active:scale-[0.97]"
                                title="Reject & Refund to Wallet"
                              >
                                <X className="h-3 w-3" /> Reject
                              </button>
                            </>
                          )}

                          {p.status === 'approved' && (
                            <button
                              onClick={() => handleAction(p.id, 'pay')}
                              className="flex items-center gap-1 bg-primary text-slate-900 hover:bg-primary/90 font-black text-[9px] px-3 py-1.5 rounded-lg uppercase transition-all active:scale-[0.97] shadow-sm"
                              title="Mark as Transferred"
                            >
                              <CreditCard className="h-3 w-3" /> Disburse Cash
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
