import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Save, RefreshCcw, Truck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface Setting {
  key: string;
  value: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    delivery_charge: '40',
    free_delivery_min: '499'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const config: any = {};
        data.forEach((item: Setting) => {
          config[item.key] = item.value;
        });
        setSettings({
          delivery_charge: config.delivery_charge || '0',
          free_delivery_min: config.free_delivery_min || '0'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates = [
        { key: 'delivery_charge', value: settings.delivery_charge },
        { key: 'free_delivery_min', value: settings.free_delivery_min }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert(update, { onConflict: 'key' });
        
        if (error) throw error;
      }

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Global Settings</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configure site-wide parameters</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Delivery Charge Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Delivery Charge</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base shipping fee</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                Amount (₹)
              </label>
              <input
                type="number"
                value={settings.delivery_charge}
                onChange={(e) => setSettings({ ...settings, delivery_charge: e.target.value })}
                placeholder="e.g. 40"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black italic text-lg focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed px-4">
              This amount will be added to the final total if subtotal is below the free delivery limit.
            </p>
          </div>
        </motion.div>

        {/* Free Delivery Limit Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Free Delivery Limit</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minimum order value</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                Minimum Amount (₹)
              </label>
              <input
                type="number"
                value={settings.free_delivery_min}
                onChange={(e) => setSettings({ ...settings, free_delivery_min: e.target.value })}
                placeholder="e.g. 499"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black italic text-lg focus:outline-none focus:border-green-500 transition-all"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed px-4">
              Order values above or equal to this will receive free shipping automatically.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Info Warning */}
      <div className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-6 flex gap-4">
        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm flex-shrink-0">
          <RefreshCcw className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase text-amber-900 tracking-widest">Crucial Note</h4>
          <p className="text-[10px] font-black text-amber-800 opacity-70 leading-relaxed mt-1">
            Updating these values will immediately affect all user carts and checkout calculations. Please ensure the numbers are accurate before saving.
          </p>
        </div>
      </div>
    </div>
  );
}
