import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Truck, UserPlus, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDeliveryBoys() {
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPincode, setNewPincode] = useState('');

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const handleAddDeliveryBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName || !newPhone || !newPincode) {
      return toast.error('Please fill all fields');
    }

    try {
      const response = await fetch('/api/admin/delivery-boys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          phone: newPhone,
          pincode: newPincode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add delivery partner');
      }

      toast.success('Delivery partner added successfully');
      setIsAddModalOpen(false);
      
      // Reset form
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewPhone('');
      setNewPincode('');
      
      fetchDeliveryBoys();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add delivery partner');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('delivery_boys')
      .update({ is_active: !currentStatus })
      .eq('id', id);
      
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      setDeliveryBoys(deliveryBoys.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
    }
  };

  const fetchDeliveryBoys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_boys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Failed to load delivery partners');
    } else {
      setDeliveryBoys(data || []);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Partners</h1>
          <p className="text-slate-500">Manage delivery boys and assigned areas</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Delivery Partner
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex flex-col items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Delivery Partner</h2>
              <form onSubmit={handleAddDeliveryBoy} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="delivery@example.com"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Min 6 characters"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="e.g. John Doe"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="+91..."
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Pincode</label>
                    <input 
                      type="text" 
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="e.g. 500001"
                    />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20"
                    >
                      Create Account
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading delivery partners...</div>
        ) : deliveryBoys.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Truck className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Delivery Partners Found</h3>
            <p className="max-w-md mx-auto">There are no delivery partners assigned yet. Add a partner and assign them to a pincode.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4 py-3">Name</th>
                <th className="p-4 py-3">User ID</th>
                <th className="p-4 py-3">Assigned Area</th>
                <th className="p-4 py-3">Status</th>
                <th className="p-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveryBoys.map((boy) => (
                <tr key={boy.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">
                       {boy.name}
                    </div>
                    <div className="text-slate-500 text-sm mt-0.5">{boy.phone}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-xs">
                    {boy.user_id}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600 font-mono">
                      <MapPin className="h-3 w-3" />
                      {boy.pincode}
                    </div>
                  </td>
                  <td className="p-4">
                    {boy.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => toggleStatus(boy.id, boy.is_active)}
                      className={`text-sm font-medium ${boy.is_active ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                    >
                      {boy.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
