import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';
import { Order } from '../types';

export const generateInvoice = async (order: Order) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129); // Emerald-600
  doc.text('VEXOKART', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Your lightning fast grocery partner', 14, 28);

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('INVOICE', 160, 22);
  doc.setFontSize(10);
  doc.text(`Order ID: ${order.id.slice(0, 8)}`, 160, 28);
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 160, 33);

  // Customer Details
  doc.setDrawColor(240);
  doc.line(14, 40, 196, 40);
  
  doc.setFontSize(12);
  doc.text('Bill To:', 14, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(order.users?.name || 'Customer', 14, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(order.users?.email || '', 14, 61);
  
  // Delivery Address
  doc.setFontSize(10);
  doc.setTextColor(100);
  const splitAddress = doc.splitTextToSize(order.address || 'N/A', 80);
  doc.text(splitAddress, 14, 66);
  doc.text(`Pincode: ${order.pincode}`, 14, 66 + (splitAddress.length * 5));

  doc.setTextColor(0);
  doc.text('Payment Method:', 140, 50);
  doc.setFont('helvetica', 'bold');
  doc.text(order.payment_method?.toUpperCase() || 'COD', 140, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${order.payment_status?.toUpperCase() || 'PENDING'}`, 140, 61);

  // Table
  const tableData = order.order_items?.map((item) => [
    item.products?.name || 'Product',
    item.quantity,
    `INR ${item.price}`,
    `INR ${item.price * item.quantity}`
  ]) || [];

  autoTable(doc, {
    startY: 85,
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: tableData,
    headStyles: { fillColor: [16, 185, 129] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Totals
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: INR ${order.total_amount}`, 140, finalY + 15);

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('Stay safe, stay healthy! Thanks for shopping with us.', 105, 280, { align: 'center' });

  // Convert to blob
  const pdfBlob = doc.output('blob');
  const fileName = `invoice_${order.id}.pdf`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    if (uploadError.message.includes('Bucket not found')) {
        // Try creating bucket if possible (usually needs admin but we'll assume it exists or needs manual creation)
        console.error('Bucket "invoices" not found. Please create it in Supabase storage.');
    }
    throw uploadError;
  }

  // Get Public URL
  const { data: urlData } = supabase.storage
    .from('invoices')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
