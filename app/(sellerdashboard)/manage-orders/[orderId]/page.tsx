"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LalamoveTracker from '@/components/LalamoveTracker';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  User, 
  Mail, 
  AlertCircle,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  RefreshCw,
  AlertTriangle,
  Download,
  Printer
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';

interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed' | 'pending' | 'confirmed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  products: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
    category?: string;
    subtotal?: number;
    image?: string;
  }[];
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
    fullAddress?: string;
  };
  paymentMethod: string;
  orderDate: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  buyerName: string;
  buyerEmail: string;
  lalamove_order_id?: string;
  lalamove_quotation_id?: string;
  lalamove_share_link?: string;
  cancellationRequest?: {
    requestedBy: 'buyer';
    reason?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  trackingSteps?: TrackingStep[];
  createdAt?: string;
  updatedAt?: string;
  totalItems?: number;
  notes?: string;
}

interface TrackingStep {
  status: string;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

export default function SellerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string;
  const activeTab = searchParams.get('tab') || 'details';
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState(false);

  const fetchOrderDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await fetch(`/api/seller/orders/${orderId}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setError('');
      } else {
        if (showLoader) {
          setError('Order not found');
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      if (showLoader) {
        setError('Failed to load order details');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      router.push('/manage-orders');
      return;
    }

    fetchOrderDetails();
  }, [orderId, router, fetchOrderDetails]);

  // Auto-refresh order details every 15 seconds (invisible background update)
  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(() => {
      fetchOrderDetails(false); // false = invisible loading
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [orderId, fetchOrderDetails]);

  const getTrackingSteps = (status: string): TrackingStep[] => {
    const allSteps = [
      { status: 'pending', title: 'Order Received', description: 'Order has been placed and is pending confirmation', completed: false },
      { status: 'confirmed', title: 'Order Confirmed', description: 'Order has been confirmed by seller', completed: false },
      { status: 'preparing', title: 'Preparing Order', description: 'Your order is being prepared for shipment', completed: false },
      { status: 'shipped', title: 'Order Shipped', description: 'Your order is on its way', completed: false },
      { status: 'delivered', title: 'Order Delivered', description: 'Order has been successfully delivered', completed: false }
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      timestamp: index === currentIndex ? new Date().toISOString() : undefined
    }));
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/seller/orders/${orderId}/update-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrderDetails(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const generateInvoicePDF = async () => {
    if (!order) return;
    
    setDownloadingInvoice(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      // Header - Clean gray style like the print version
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(28);
      pdf.setFont(undefined, 'bold');
      pdf.text('HARVEST HUB', pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text('Fresh from Farm to Your Table', pageWidth / 2, 42, { align: 'center' });
      
      // Reset to black for rest of content
      pdf.setTextColor(0, 0, 0);
      
      // Invoice Title
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('INVOICE', pageWidth / 2, 65, { align: 'center' });
      
      // Main info section with border - matching print layout
      const infoY = 85;
      const infoHeight = 85;
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, infoY, pageWidth - (2 * margin), infoHeight);
      
      // Left column - Order Details and Customer Info
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Order Details:', margin + 5, infoY + 12);
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.text(`Order Number: ${order.orderNumber}`, margin + 5, infoY + 22);
      pdf.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, margin + 5, infoY + 30);
      pdf.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, margin + 5, infoY + 38);
      pdf.text(`Payment Method: ${order.paymentMethod}`, margin + 5, infoY + 46);
      
      // Customer Information
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text('Customer Information:', margin + 5, infoY + 58);
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const customerName = order.deliveryAddress?.fullName || order.buyerName || 'N/A';
      pdf.text(`Name: ${customerName}`, margin + 5, infoY + 68);
      if (order.buyerEmail) {
        pdf.text(`Email: ${order.buyerEmail}`, margin + 5, infoY + 76);
      }
      
      // Right column - Seller Info and Delivery Address  
      const rightX = pageWidth / 2 + 5;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text('Seller Information:', rightX, infoY + 12);
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const sellerName = order.sellerFullName || order.sellerName || 'N/A';
      pdf.text(`Name: ${sellerName}`, rightX, infoY + 22);
      if (order.sellerEmail) {
        pdf.text(`Business Email: ${order.sellerEmail}`, rightX, infoY + 30);
      }
      if (order.sellerPhone) {
        pdf.text(`Phone: ${order.sellerPhone}`, rightX, infoY + 38);
      }
      
      // Delivery Address
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text('Delivery Address:', rightX, infoY + 50);
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const address = order.deliveryAddress.fullAddress || 
        `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.province}`;
      // Split long addresses
      const addressLines = address.match(/.{1,45}/g) || [address];
      addressLines.forEach((line, index) => {
        pdf.text(line.trim(), rightX, infoY + 60 + (index * 8));
      });
      
      // Products Table - matching print layout exactly
      const tableY = 185;
      
      // Table header with gray background like print version
      pdf.setFillColor(245, 245, 245);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, tableY, pageWidth - (2 * margin), 12, 'FD');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text('Product Name', margin + 5, tableY + 8);
      pdf.text('Quantity', margin + 70, tableY + 8);
      pdf.text('Unit Price', margin + 110, tableY + 8);
      pdf.text('Total', margin + 150, tableY + 8);
      
      // Table rows
      let currentY = tableY + 12;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      
      order.products.forEach((product) => {
        const rowHeight = 12;
        // Draw row border
        pdf.rect(margin, currentY, pageWidth - (2 * margin), rowHeight, 'D');
        
        const productName = product.productName.length > 25 
          ? product.productName.substring(0, 22) + '...' 
          : product.productName;
          
        pdf.text(productName, margin + 5, currentY + 8);
        pdf.text(`${product.quantity} ${product.unit}`, margin + 70, currentY + 8);
        pdf.text(`P${product.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, margin + 110, currentY + 8);
        pdf.text(`P${(product.quantity * product.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, margin + 150, currentY + 8);
        
        currentY += rowHeight;
      });
      
      // Totals section - right aligned like print version
      const totalsY = currentY + 15;
      const totalsX = pageWidth - 85;
      const totalsWidth = 70;
      
      // Totals box with border
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(totalsX - totalsWidth, totalsY, totalsWidth, 35, 'D');
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      pdf.text('Subtotal:', totalsX - totalsWidth + 5, totalsY + 10);
      pdf.text(`P${(order.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, totalsX - 5, totalsY + 10, { align: 'right' });
      
      pdf.text('Delivery Fee:', totalsX - totalsWidth + 5, totalsY + 20);
      pdf.text(`P${(order.deliveryFee || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, totalsX - 5, totalsY + 20, { align: 'right' });
      
      // Final total with gray background
      pdf.setFillColor(230, 230, 230);
      pdf.rect(totalsX - totalsWidth, totalsY + 25, totalsWidth, 10, 'F');
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.text('TOTAL:', totalsX - totalsWidth + 5, totalsY + 32);
      pdf.text(`P${(order.finalAmount || order.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, totalsX - 5, totalsY + 32, { align: 'right' });
      
      // Footer - matching print version
      const footerY = totalsY + 55;
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      
      pdf.text('Thank you for shopping with HarvestHub!', pageWidth / 2, footerY, { align: 'center' });
      pdf.text('Supporting local farmers and bringing fresh produce to your table.', pageWidth / 2, footerY + 8, { align: 'center' });
      pdf.text('For support: support@harvesthub.ph | Visit us at harvesthub.ph', pageWidth / 2, footerY + 16, { align: 'center' });
      
      pdf.setFontSize(8);
      pdf.text(`Invoice #${order.orderNumber}`, pageWidth / 2, footerY + 28, { align: 'center' });
      pdf.text(`Invoice #${order.orderNumber}`, pageWidth - 25, pageHeight - 10, { align: 'right' });
      
      // Download the PDF
      pdf.save(`HarvestHub-Seller-Invoice-${order.orderNumber}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const printInvoice = async () => {
    if (!order) return;
    
    setPrintingInvoice(true);
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the invoice.');
        return;
      }
      
      // Generate HTML content for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>HarvestHub Seller Invoice - ${order.orderNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              background-color: #103C2E;
              color: white;
              padding: 30px;
              text-align: center;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 14px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 30px;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              border: 1px solid #ddd;
              padding: 20px;
            }
            .info-column {
              flex: 1;
            }
            .label {
              font-weight: bold;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .totals {
              float: right;
              width: 300px;
              border: 1px solid #ddd;
              padding: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .final-total {
              background-color: #103C2E;
              color: white;
              padding: 10px;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">HARVEST HUB</div>
            <div class="subtitle">Seller Invoice</div>
          </div>
          
          <div class="invoice-title">INVOICE</div>
          
          <div class="info-section">
            <div class="info-column">
              <div class="label">Order Details:</div>
              <div>Order Number: ${order.orderNumber}</div>
              <div>Date: ${new Date(order.orderDate).toLocaleDateString()}</div>
              <div>Payment Status: ${order.paymentStatus.toUpperCase()}</div>
              <div>Payment Method: ${order.paymentMethod}</div>
              <br>
              <div class="label">Customer Information:</div>
              <div><strong>Name:</strong> ${order.deliveryAddress?.fullName || order.buyerName || 'N/A'}</div>
              ${order.buyerEmail ? `<div><strong>Email:</strong> ${order.buyerEmail}</div>` : ''}
              ${(order.buyerPhone || order.deliveryAddress?.phone) ? `<div><strong>Phone:</strong> ${order.buyerPhone || order.deliveryAddress?.phone}</div>` : ''}
            </div>
            <div class="info-column">
              <div class="label">Seller Information:</div>
              <div><strong>Name:</strong> ${order.sellerFullName || order.sellerName || 'N/A'}</div>
              ${order.sellerEmail ? `<div><strong>Business Email:</strong> ${order.sellerEmail}</div>` : ''}
              ${order.sellerPhone ? `<div><strong>Phone:</strong> ${order.sellerPhone}</div>` : ''}
              <br>
              <div class="label">Delivery Address:</div>
              <div>${order.deliveryAddress.fullAddress || `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.province} ${order.deliveryAddress.zipCode}`}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.products.map(product => `
                <tr>
                  <td>${product.productName}</td>
                  <td>${product.quantity} ${product.unit}</td>
                  <td>₱${product.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td>₱${(product.quantity * product.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₱${order.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="total-row">
              <span>Delivery Fee:</span>
              <span>₱${order.deliveryFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="final-total">
              <div class="total-row">
                <span>TOTAL:</span>
                <span>₱${order.finalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
          
          <div style="clear: both;"></div>
          
          <div class="footer">
            <div>Thank you for selling with HarvestHub!</div>
            <div>Supporting local farmers and bringing fresh produce to communities.</div>
            <div>For support: support@harvesthub.ph | Visit us at harvesthub.ph</div>
            <div style="margin-top: 10px;">Invoice #${order.orderNumber}</div>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error printing invoice. Please try again.');
    } finally {
      setPrintingInvoice(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#103C2E] mx-auto"></div>
          <p className="mt-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
          <Link href="/manage-orders" className="mt-4 inline-block text-[#103C2E] hover:underline" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Return to Orders
          </Link>
        </div>
      </div>
    );
  }

  const trackingSteps = getTrackingSteps(order.status);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/manage-orders"
            className="inline-flex items-center gap-2 text-[#103C2E] hover:text-[#0d2e23] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </Link>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#103C2E] mb-2">
                Order #{order.orderNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${statusColors[order.status as keyof typeof statusColors]} border`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                {order.cancellationRequest?.status === 'pending' && (
                  <Badge className="bg-red-100 text-red-800 border-red-300 animate-pulse">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Cancellation Requested
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#103C2E]">
                ₱{order.finalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {order.products.length} {order.products.length === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Method</p>
              <p className="font-medium uppercase">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-gray-600">Payment Status</p>
              <p className="font-medium capitalize">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-gray-600">Estimated Delivery</p>
              <p className="font-medium">
                {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'TBD'}
              </p>
            </div>
          </div>
        </div>

        {/* Cancellation Request Notice */}
        {order.cancellationRequest?.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Cancellation Request Pending
                </p>
                <p className="text-sm text-red-700 mb-2">
                  The buyer has requested to cancel this order. Please review and take action.
                </p>
                {order.cancellationRequest.reason && (
                  <div className="bg-white border border-red-200 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-900">{order.cancellationRequest.reason}</p>
                  </div>
                )}
                <p className="text-xs text-red-600">
                  Requested on: {new Date(order.cancellationRequest.requestedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <Link
                href={`/manage-orders/${orderId}?tab=details`}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-[#103C2E] text-[#103C2E]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Order Details
              </Link>
              <Link
                href={`/manage-orders/${orderId}?tab=tracking`}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tracking'
                    ? 'border-[#103C2E] text-[#103C2E]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Order Tracking
              </Link>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{order.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{order.buyerEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Delivery Address
                    </h3>
                    <div className="space-y-1 text-gray-700">
                      <p className="font-medium">{order.buyerName}</p>
                      <p>{order.deliveryAddress.street}</p>
                      {order.deliveryAddress.barangay && <p>{order.deliveryAddress.barangay}</p>}
                      <p>{order.deliveryAddress.city}, {order.deliveryAddress.province}</p>
                      <p>{order.deliveryAddress.zipCode}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Items ({order.products.length})
                  </h3>
                  
                  <div className="space-y-4">
                    {order.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center pb-4 border-b last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.productName}</p>
                          <p className="text-sm text-gray-600">
                            {product.quantity} {product.unit} × ₱{product.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 text-lg">
                          ₱{(product.quantity * product.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">₱{order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">₱{order.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-[#103C2E]">₱{order.finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#103C2E] flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium">{order.paymentMethod.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#103C2E]">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={generateInvoicePDF}
                        disabled={downloadingInvoice}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingInvoice ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {downloadingInvoice ? 'Generating...' : 'Download Invoice'}
                        </span>
                      </button>
                      
                      <button 
                        onClick={printInvoice}
                        disabled={printingInvoice}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {printingInvoice ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Printer className="w-4 h-4" />
                        )}
                        <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {printingInvoice ? 'Printing...' : 'Print Invoice'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tracking' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Tracking
                  </h2>
                  
                  <div className="relative">
                    {trackingSteps.map((step, index) => (
                      <div key={step.status} className="relative flex items-start pb-8 last:pb-0">
                        {/* Timeline Line */}
                        {index < trackingSteps.length - 1 && (
                          <div className={`absolute left-4 top-8 w-0.5 h-full ${
                            step.completed ? 'bg-green-400' : 'bg-gray-200'
                          }`}></div>
                        )}
                        
                        {/* Status Icon */}
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? step.status === 'cancelled' 
                              ? 'bg-red-500' 
                              : 'bg-green-500'
                            : 'bg-gray-300'
                        }`}>
                          {step.completed ? (
                            step.status === 'cancelled' ? (
                              <XCircle className="w-5 h-5 text-white" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )
                          ) : (
                            <Clock className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        
                        {/* Step Content */}
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-semibold ${
                              step.completed ? 'text-gray-900' : 'text-gray-500'
                            }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {step.title}
                            </h3>
                            {step.timestamp && step.completed && (
                              <span className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {new Date().toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })} at {new Date().toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            step.completed ? 'text-gray-600' : 'text-gray-400'
                          }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.status === 'cancelled' && (
                    <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Order Cancelled
                          </h4>
                          <p className="text-sm text-red-700 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            This order has been cancelled. Contact the buyer if you have any questions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {order.estimatedDelivery && !['delivered', 'completed', 'cancelled'].includes(order.status) && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Estimated Delivery
                          </h4>
                          <p className="text-sm text-blue-700 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Order is expected to be delivered by {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Lalamove Tracking */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#103C2E]">Delivery Tracking</h3>
                  <LalamoveTracker 
                    lalamoveOrderId={order.lalamove_order_id}
                    lalamoveShareLink={order.lalamove_share_link}
                    quotationId={order.lalamove_quotation_id}
                    orderStatus={order.status}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}