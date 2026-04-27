import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Store, UserPlus, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorPassword, setNewVendorPassword] = useState('');
  const [newVendorStore, setNewVendorStore] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorPincode, setNewVendorPincode] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorEmail || !newVendorPassword || !newVendorStore || !newVendorPhone || !newVendorPincode) {
      return toast.error('Please fill all fields');
    }

    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newVendorEmail,
          password: newVendorPassword,
          storeName: newVendorStore,
          phone: newVendorPhone,
          pincode: newVendorPincode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vendor');
      }

      toast.success('Vendor added successfully');
      setIsAddModalOpen(false);
      
      // Reset form
      setNewVendorEmail('');
      setNewVendorPassword('');
      setNewVendorStore('');
      setNewVendorPhone('');
      setNewVendorPincode('');
      
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add vendor');
    }
  };

  const toggleVendorStatus = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vendors')
      .update({ is_active: !currentStatus })
      .eq('id', vendorId);
      
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Vendor status updated');
      setVendors(vendors.map(v => v.id === vendorId ? { ...v, is_active: !currentStatus } : v));
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Failed to load vendors');
    } else {
      setVendors(data || []);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-slate-500">Manage vendors and assign delivery areas</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex flex-col items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Vendor</h2>
              <form onSubmit={handleAddVendor} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newVendorEmail}
                      onChange={(e) => setNewVendorEmail(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="vendor@example.com"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newVendorPassword}
                      onChange={(e) => setNewVendorPassword(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Min 6 characters"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Store / Business Name</label>
                    <input 
                      type="text" 
                      value={newVendorStore}
                      onChange={(e) => setNewVendorStore(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="e.g. Fresh Mart"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={newVendorPhone}
                      onChange={(e) => setNewVendorPhone(e.target.value)}
                      className="w-full rounded-xl border-slate-200 border p-3 bg-slate-50 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="+91..."
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Pincode</label>
                    <input 
                      type="text" 
                      value={newVendorPincode}
                      onChange={(e) => setNewVendorPincode(e.target.value)}
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
                      Add Vendor
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Store className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Vendors Found</h3>
            <p className="max-w-md mx-auto">There are no vendors assigned yet. Add a vendor and assign them to a pincode.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4 py-3">Vendor Name</th>
                <th className="p-4 py-3">User ID</th>
                <th className="p-4 py-3">Assigned Pincodes</th>
                <th className="p-4 py-3">Status</th>
                <th className="p-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                       {vendor.store_name}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-xs">
                    <div>{vendor.user_id}</div>
                    <div className="text-slate-500 font-sans mt-1">{vendor.phone}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600 font-mono">
                      <MapPin className="h-3 w-3" />
                      {vendor.pincode}
                    </div>
                  </td>
                  <td className="p-4">
                    {vendor.is_active ? (
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
                    <button className="text-primary hover:text-primary/80 font-medium text-sm">
                      Manage
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
