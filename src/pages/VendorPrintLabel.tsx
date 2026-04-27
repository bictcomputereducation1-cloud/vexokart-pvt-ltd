import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Printer, ArrowLeft, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function VendorPrintLabel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    if (!id) return;
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          users:user_id (
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch vendor
      if (orderData.vendor_id) {
        // Here vendor_id in orders is actually users.id from the assignment in previous fix
        // Wait, earlier we mapped vendor_id to users.id or vendors.id?
        // Let's query vendor by user_id or id
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', orderData.vendor_id)
          .maybeSingle();
        
        if (vendorData) {
           setVendor(vendorData);
        } else {
           // fallback: if vendor_id was set to user_id (we fixed this to use vendor.id recently but some old orders might have user_id)
           const { data: vendorDataByUserId } = await supabase
             .from('vendors')
             .select('*')
             .eq('user_id', orderData.vendor_id)
             .maybeSingle();
           if (vendorDataByUserId) setVendor(vendorDataByUserId);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading label...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-red-500">Order not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Non-printable header */}
      <div className="print:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate('/vendor/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 font-medium px-6 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Printer className="h-5 w-5" /> Print Label
          </button>
        </div>
      </div>

      {/* Printable Label Area */}
      <div className="p-8 print:p-0 flex justify-center">
        <div className="bg-white w-full max-w-3xl shadow-xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden text-slate-900">
          
          {/* Header */}
          <div className="p-8 border-b border-slate-200 bg-slate-50 print:bg-white flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
                <Package className="h-8 w-8" />
                VexoKart
              </h1>
              <p className="text-slate-500 mt-1 font-medium">Packing Slip & Invoice</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-slate-900">
                #{order.id.split('-')[0].toUpperCase()}
              </div>
              <div className="text-sm text-slate-500 font-medium mt-1">
                {format(new Date(order.created_at), 'PPP')}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* From / To Section */}
            <div className="grid grid-cols-2 gap-12 mb-10">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">From (Vendor)</h3>
                <div className="font-semibold text-lg">{vendor?.store_name || 'VexoKart Vendor'}</div>
                {vendor?.phone && <div className="text-slate-600 mt-1">{vendor.phone}</div>}
                <div className="text-slate-600 mt-1">Pincode: <span className="font-mono font-medium">{vendor?.pincode}</span></div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Deliver To</h3>
                {/* Because order.address might contain the full name from previous structure or just address text */}
                <div className="font-semibold text-lg">{order.users?.name || 'Customer'}</div>
                <div className="text-slate-600 mt-1 pb-1 border-b border-dashed border-slate-200 w-fit">{order.users?.email}</div>
                <div className="text-slate-800 mt-3 leading-relaxed">
                  {order.address}
                </div>
              </div>
            </div>

            {/* Order Info Bar */}
            <div className="flex gap-8 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100 print:border-slate-300 print:bg-transparent">
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                  <span className="font-semibold capitalize">{order.status}</span>
               </div>
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</span>
                  <span className="font-semibold uppercase">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
               </div>
               <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</span>
                  <span className="font-semibold capitalize">{order.payment_status}</span>
               </div>
            </div>

            {/* Products Table */}
            <div className="mb-10">
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Order Items</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="pb-3 w-2/3">Item Description</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                  {order.order_items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="font-semibold text-slate-900">{item.products?.name || 'Product Missing'}</div>
                      </td>
                      <td className="py-4 text-center font-medium">x{item.quantity}</td>
                      <td className="py-4 text-right font-medium">₹{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Calculation */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{order.total_amount + (order.discount_amount || 0) - (order.delivery_fee || 0)}</span>
                </div>
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span className="font-medium">₹{order.delivery_fee}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{order.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-3 border-t border-slate-200 text-slate-900 mt-2">
                  <span>Total</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-16 pt-8 border-t border-slate-200 text-center">
              <p className="font-bold text-slate-800 text-lg">Thank you for shopping with VexoKart!</p>
              <p className="text-slate-500 mt-1 text-sm">If you have any questions, please contact our support team.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
