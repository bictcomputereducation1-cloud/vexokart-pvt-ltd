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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from('orders').select('total_amount'),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' })
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      setStats({
        totalOrders: ordersRes.data?.length || 0,
        totalRevenue,
        totalProducts: productsRes.count || 0,
        totalUsers: usersRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <div className="flex gap-2">
          <Link to="/admin/products">
            <Button variant="outline">Manage Products</Button>
          </Link>
          <Link to="/admin/orders">
            <Button variant="outline">Manage Orders</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-slate-400 mt-1">+5% from last week</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-slate-400 mt-1">Across {stats.totalProducts > 0 ? 'multiple' : '0'} categories</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-slate-400 mt-1">Active customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link to="/admin/products" className="group">
              <div className="p-4 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors border border-transparent group-hover:border-primary/20">
                <Package className="h-6 w-6 text-slate-400 group-hover:text-primary mb-2" />
                <p className="font-semibold text-sm">Add Product</p>
                <p className="text-xs text-slate-500">Manage inventory</p>
              </div>
            </Link>
            <Link to="/admin/categories" className="group">
              <div className="p-4 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors border border-transparent group-hover:border-primary/20">
                <Layers className="h-6 w-6 text-slate-400 group-hover:text-primary mb-2" />
                <p className="font-semibold text-sm">Categories</p>
                <p className="text-xs text-slate-500">Organize store</p>
              </div>
            </Link>
            <Link to="/admin/orders" className="group">
              <div className="p-4 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors border border-transparent group-hover:border-primary/20">
                <ShoppingBag className="h-6 w-6 text-slate-400 group-hover:text-primary mb-2" />
                <p className="font-semibold text-sm">Orders</p>
                <p className="text-xs text-slate-500">Process shipments</p>
              </div>
            </Link>
            <div className="p-4 rounded-xl bg-slate-50 opacity-50 cursor-not-allowed">
              <Users className="h-6 w-6 text-slate-400 mb-2" />
              <p className="font-semibold text-sm">Users</p>
              <p className="text-xs text-slate-500">Customer base</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Recent Activity
              <Button variant="ghost" size="sm" className="text-primary">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">New Order #1234</p>
                  <p className="text-xs text-slate-500">2 minutes ago • ₹450</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Product Updated</p>
                  <p className="text-xs text-slate-500">1 hour ago • Organic Apples</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Low Stock Alert</p>
                  <p className="text-xs text-slate-500">3 hours ago • Fresh Milk</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
