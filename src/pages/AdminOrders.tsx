import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { ShoppingBag, Eye, Search, Download, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { generateInvoice } from '../lib/invoiceService';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (name, email),
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const uniqueOrders = Array.from(new Map((data || []).map(o => [o.id, o])).values());
      setOrders(uniqueOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (order: Order, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (error) throw error;
      
      toast.success(`Order marked as ${status}`);

      // Generate invoice if status is packed and no invoice exists
      if (status === 'packed' && !order.invoice_url) {
        setGeneratingInvoiceId(order.id);
        try {
          const invoiceUrl = await generateInvoice(order);
          await supabase
            .from('orders')
            .update({ invoice_url: invoiceUrl })
            .eq('id', order.id);
          toast.success('Invoice generated successfully');
        } catch (err: any) {
          console.error('Invoice error:', err);
          if (err.message?.includes('violates row-level security policy')) {
            toast.error('Permission denied: Please ensure storage policies are set up in Supabase.');
          } else {
            toast.error('Failed to generate invoice. Please check if "invoices" bucket exists in Storage.');
          }
        } finally {
          setGeneratingInvoiceId(null);
        }
      }

      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.users?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-emerald-100 text-emerald-700';
      case 'packed': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShoppingBag className="h-6 w-6 text-primary" />
        Manage Orders
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search by Order ID or Customer..." 
          className="pl-10 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.users?.name}</span>
                    <span className="text-xs text-slate-500">{order.users?.email}</span>
                  </div>
                </TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-bold">₹{order.total_amount}</TableCell>
                <TableCell key={`${order.id}-${order.status}`}>
                  <Select 
                    defaultValue={order.status} 
                    onValueChange={(val) => updateStatus(order, val)}
                  >
                    <SelectTrigger className={`w-[130px] h-8 text-xs font-semibold ${getStatusColor(order.status)} border-none`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {order.invoice_url ? (
                      <a 
                        href={order.invoice_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 hover:bg-slate-100 rounded-lg text-emerald-600 transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    ) : generatingInvoiceId === order.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Customer</p>
                  <p className="font-semibold">{selectedOrder.users?.name}</p>
                  <p className="text-xs">{selectedOrder.users?.email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Payment ID</p>
                  <p className="font-mono text-xs">{selectedOrder.payment_id}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.order_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.products?.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.price * item.quantity}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-slate-50">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right text-primary">₹{selectedOrder.total_amount}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
