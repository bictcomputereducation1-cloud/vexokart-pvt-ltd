import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Coupon } from '../types';
import { toast } from 'sonner';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit2, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  Tag,
  Percent,
  IndianRupee,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'flat' as 'flat' | 'percentage',
    discount_value: '',
    min_order_amount: '',
    is_active: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discount_value: Number(formData.discount_value),
        min_order_amount: Number(formData.min_order_amount)
      };

      if (editingId) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([payload]);

        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setFormData({
        code: '',
        discount_type: 'flat',
        discount_value: '',
        min_order_amount: '',
        is_active: true
      });
      setShowAddForm(false);
      setEditingId(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount),
      is_active: coupon.is_active
    });
    setEditingId(coupon.id);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Coupon Management</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Manage discounts and promotions</p>
        </div>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Coupon
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2rem] border-2 border-slate-100 p-8 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Coupon Code</label>
                  <input 
                    type="text"
                    required
                    placeholder="E.g. SAVE20"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Discount Type</label>
                  <select 
                    value={formData.discount_type}
                    onChange={e => setFormData({...formData, discount_type: e.target.value as 'flat' | 'percentage'})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input 
                    type="number"
                    required
                    placeholder="E.g. 10"
                    value={formData.discount_value}
                    onChange={e => setFormData({...formData, discount_value: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Min Order Amount (₹)</label>
                  <input 
                    type="number"
                    required
                    placeholder="E.g. 500"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({...formData, min_order_amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="hidden"
                  />
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.is_active ? 'bg-primary' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-600">Active Status</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  {editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ code: '', discount_type: 'flat', discount_value: '', min_order_amount: '', is_active: true });
                  }}
                  className="bg-white border-2 border-slate-100 text-slate-400 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
           <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Existing Coupons</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Coupon Info</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Min Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                    No coupons found
                  </td>
                </tr>
              ) : coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-widest mb-0.5 uppercase">{coupon.code}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Created recently</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-1">
                      {coupon.discount_type === 'percentage' ? (
                        <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                          {coupon.discount_value}% <Percent className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1">
                          ₹{coupon.discount_value} <IndianRupee className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 font-bold text-sm text-slate-600">
                    ₹{coupon.min_order_amount}
                  </td>
                  <td className="px-6 py-6">
                    <button 
                      onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${
                        coupon.is_active 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {coupon.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => handleEdit(coupon)}
                         className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                       >
                         <Edit2 className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => deleteCoupon(coupon.id)}
                         className="p-2 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
