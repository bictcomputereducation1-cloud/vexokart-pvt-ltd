import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Layers, 
  TrendingUp, 
  Users, 
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0
  });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, usersRes, recentProductsRes] = await Promise.all([
        supabase.from('orders').select('total_amount'),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      setStats({
        totalOrders: ordersRes.data?.length || 0,
        totalRevenue,
        totalProducts: productsRes.count || 0,
        totalUsers: usersRes.count || 0
      });
      setRecentProducts(recentProductsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Error deleting product');
    }
  };

  if (loading) return <div className="py-20 text-center font-bold uppercase tracking-widest text-slate-400 text-xs">Loading board...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Admin Panel</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Vexokart Management Console</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products">
            <button className="bg-white border-2 border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all active:scale-95">Manage Products</button>
          </Link>
          <Link to="/admin/orders">
            <button className="bg-primary border-2 border-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95">Manage Orders</button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Products</p>
          <h3 className="text-3xl font-black italic tracking-tighter leading-none">{stats.totalProducts}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Orders</p>
          <h3 className="text-3xl font-black italic tracking-tighter leading-none">{stats.totalOrders}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Users</p>
          <h3 className="text-3xl font-black italic tracking-tighter leading-none">{stats.totalUsers}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-2 border-primary shadow-lg shadow-primary/10 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Revenue</p>
          <h3 className="text-3xl font-black italic tracking-tighter leading-none text-primary">₹{stats.totalRevenue.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Quick Inventory Check</h2>
          <Link to="/admin/products" className="text-[10px] font-black uppercase text-primary">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 text-sm">{p.name}</td>
                  <td className="px-6 py-4 font-black italic text-sm">₹{p.price}</td>
                  <td className="px-6 py-4 font-bold text-xs">
                    <span className={p.stock < 10 ? 'text-red-500' : 'text-emerald-500'}>
                      {p.stock} Units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/products`}>
                        <button className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <Package className="h-4 w-4 text-slate-400" />
                        </button>
                      </Link>
                      <button 
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Layers className="h-4 w-4 text-red-400" />
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
