"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingDots from '@/components/ui/LoadingDots';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ReviewSection from '@/components/ReviewSection';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Copy,
  Download,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderDetails {
  _id: string;
  orderNumber: string;
  orderDate: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
    category: string;
    subtotal: number;
    image?: string;
  }>;
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  status: 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
    fullAddress: string;
  };
  sellerId: string;
  sellerName: string;
  notes?: string;
  refusalReason?: string;
  refusalDate?: string;
  cancellationRequest?: {
    requestedBy: 'buyer';
    reason?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  createdAt: string;
  updatedAt: string;
  totalItems: number;
  canCancel: boolean;
  canTrack: boolean;
  canContactSeller: boolean;
  isActive: boolean;
  trackingSteps: TrackingStep[];
  summary: {
    itemCount: number;
    totalQuantity: number;
    avgItemPrice: number;
    hasDeliveryFee: boolean;
    savings: number;
  };
}

interface TrackingStep {
  status: string;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    order: OrderDetails;
    meta: any;
  };
  message?: string;
}

const statusColors = {
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = (params?.id ?? '') as string;
  const activeTab = (searchParams?.get('tab') ?? 'details') as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState(false);

  // Cancel confirmation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Receive confirmation dialog state
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  
  // Refuse delivery dialog state
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  
  // Result dialog state
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({ open: false, success: false, message: '' });

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await fetch(`/api/buyer/orders/${orderId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view order details');
        } else if (response.status === 404) {
          throw new Error('Order not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this order');
        } else {
          throw new Error('Failed to fetch order details');
        }
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setOrder(data.data.order);
      } else {
        throw new Error(data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
      setOrder(null);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshOrderDetails = async () => {
    setRefreshing(true);
    await fetchOrderDetails(false);
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setShowCancelDialog(true);
  };

  const confirmCancelOrder = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      const response = await fetch(`/api/buyer/orders/${orderId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowCancelDialog(false);
        setCancelReason(''); // Reset reason
        
        // Check if it requires approval
        if (data.requiresApproval) {
          setResultDialog({
            open: true,
            success: true,
            message: 'Cancellation request submitted. The seller will review your request and respond shortly.'
          });
        } else {
          setResultDialog({
            open: true,
            success: true,
            message: 'Order cancelled successfully.'
          });
        }
        
        await fetchOrderDetails(false); // Refresh order details
      } else {
        setShowCancelDialog(false);
        
        // Show error message
        setResultDialog({
          open: true,
          success: false,
          message: data.message || 'Failed to cancel order. Please try again.'
        });
      }
    } catch (error) {
      setShowCancelDialog(false);
      
      // Show error message
      setResultDialog({
        open: true,
        success: false,
        message: 'Error cancelling order. Please check your connection and try again.'
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleReceiveOrder = async () => {
    if (!order) return;
    setShowReceiveDialog(true);
  };

  const confirmReceiveOrder = async () => {
    if (!order) return;

    try {
      setReceiving(true);
      const response = await fetch(`/api/buyer/orders/${orderId}/receive`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setShowReceiveDialog(false);
        
        // Show success message
        setResultDialog({
          open: true,
          success: true,
          message: 'Order marked as received! Thank you for confirming delivery.'
        });
        
        await fetchOrderDetails(false); // Refresh order details
      } else {
        setShowReceiveDialog(false);
        
        // Show error message
        setResultDialog({
          open: true,
          success: false,
          message: data.message || 'Failed to mark order as received. Please try again.'
        });
      }
    } catch (error) {
      setShowReceiveDialog(false);
      
      // Show error message
      setResultDialog({
        open: true,
        success: false,
        message: 'Error marking order as received. Please check your connection and try again.'
      });
    } finally {
      setReceiving(false);
    }
  };

  const handleRefuseDelivery = async () => {
    if (!order) return;
    setRefuseReason('');
    setShowRefuseDialog(true);
  };

  const confirmRefuseDelivery = async () => {
    if (!order) return;
    
    if (!refuseReason.trim()) {
      setResultDialog({
        open: true,
        success: false,
        message: 'Please provide a reason for refusing the delivery.'
      });
      return;
    }

    try {
      setRefusing(true);
      const response = await fetch(`/api/buyer/orders/${orderId}/refuse`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: refuseReason })
      });

      const data = await response.json();

      if (response.ok) {
        setShowRefuseDialog(false);
        
        // Show success message
        setResultDialog({
          open: true,
          success: true,
          message: 'Delivery refused. The seller has been notified and your order will be processed accordingly.'
        });
        
        await fetchOrderDetails(false); // Refresh order details
      } else {
        setShowRefuseDialog(false);
        
        // Show error message
        setResultDialog({
          open: true,
          success: false,
          message: data.message || 'Failed to refuse delivery. Please try again.'
        });
      }
    } catch (error) {
      setShowRefuseDialog(false);
      
      // Show error message
      setResultDialog({
        open: true,
        success: false,
        message: 'Error refusing delivery. Please check your connection and try again.'
      });
    } finally {
      setRefusing(false);
    }
  };

  const handleContactSeller = async () => {
    if (!order) return;

    try {
      setContacting(true);

      // Send order details message automatically using existing chat API
      const orderDetailsMessage = `Hi! I have a question about my order #${order.orderNumber}\n\nOrder Date: ${formatDate(order.orderDate)}\nTotal Amount: ${formatCurrency(order.finalAmount)}\nStatus: ${order.status}\n\nProducts:\n${order.products.map(p => `- ${p.productName} (${p.quantity} ${p.unit})`).join('\n')}`;

      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: order.sellerId,
          message: orderDetailsMessage
        })
      });

      if (response.ok) {
        // Redirect to inbox after sending message
        window.location.href = '/inbox';
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setResultDialog({
        open: true,
        success: false,
        message: 'Failed to contact seller. Please try again.'
      });
    } finally {
      setContacting(false);
    }
  };

  const copyOrderNumber = async () => {
    if (order) {
      try {
        await navigator.clipboard.writeText(order.orderNumber);
        // Could add toast notification here
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = order.orderNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
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
      pdf.text(`Date: ${formatDate(order.orderDate)}`, margin + 5, infoY + 30);
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
        const itemTotal = product.subtotal || (product.quantity * product.price);
        pdf.text(`P${itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, margin + 150, currentY + 8);
        
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
      const finalTotal = order.finalAmount || order.totalAmount || 0;
      pdf.text(`P${finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, totalsX - 5, totalsY + 32, { align: 'right' });
      
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
      pdf.save(`HarvestHub-Invoice-${order.orderNumber}.pdf`);
      
      // Show success message
      setResultDialog({
        open: true,
        success: true,
        message: 'Invoice downloaded successfully!'
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setResultDialog({
        open: true,
        success: false,
        message: 'Error generating invoice. Please try again.'
      });
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
          <title>HarvestHub Invoice - ${order.orderNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              background-color: #4A7C59;
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
              background-color: #4A7C59;
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
            <div class="subtitle">Fresh from Farm to Your Table</div>
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
              <div>${order.deliveryAddress.fullAddress}</div>
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
                  <td>₱${product.price.toFixed(2)}</td>
                  <td>₱${product.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₱${order.totalAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Delivery Fee:</span>
              <span>₱${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="final-total">
              <div class="total-row">
                <span>TOTAL:</span>
                <span>₱${order.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div style="clear: both;"></div>
          
          <div class="footer">
            <div>Thank you for shopping with HarvestHub!</div>
            <div>Supporting local farmers and bringing fresh produce to your table.</div>
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
      setResultDialog({
        open: true,
        success: false,
        message: 'Error printing invoice. Please try again.'
      });
    } finally {
      setPrintingInvoice(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#103C2E" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loading order details
          </h3>
          <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Please wait
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {error || 'Order not found'}
            </h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/buyer-orders"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Orders
              </Link>
              {error && (
                <button
                  onClick={() => fetchOrderDetails()}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/buyer-orders"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Orders
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Order #{order.orderNumber}
                </h1>
                <button
                  onClick={copyOrderNumber}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy Order Number"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={refreshOrderDetails}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Refresh Order Details"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Placed on {formatDate(order.orderDate)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusColors[order.status]}`}>
                <Package className="w-4 h-4" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${paymentStatusColors[order.paymentStatus]}`}>
                <CreditCard className="w-4 h-4" />
                Payment {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <Link
                href={`/buyer-orders/${orderId}`}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Order Details
              </Link>
              <Link
                href={`/buyer-orders/${orderId}?tab=tracking`}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tracking'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Order Tracking
              </Link>
              {(order.status === 'delivered' || order.status === 'completed') && (
                <Link
                  href={`/buyer-orders/${orderId}?tab=review`}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'review'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Write Review
                </Link>
              )}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'review' ? (
          <ReviewSection orderId={order._id} products={order.products} />
        ) : activeTab === 'details' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Products */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Items ({order.summary.itemCount} products, {order.summary.totalQuantity} items)
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {order.products.map((product, index) => (
                    <div key={index} className="p-6 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {product.productName}
                        </h3>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Category: {product.category}
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Quantity: {product.quantity} {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {formatCurrency(product.price)}
                        </p>
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          per {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {formatCurrency(product.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <MapPin className="w-5 h-5" />
                  Delivery Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Delivery Address
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {order.deliveryAddress.fullAddress}
                    </p>
                  </div>
                  
                  {order.estimatedDelivery && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Estimated Delivery
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatDate(order.estimatedDelivery)}
                      </p>
                    </div>
                  )}
                  
                  {order.actualDelivery && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Actual Delivery
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatDate(order.actualDelivery)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Order Notes
                  </h2>
                  <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Cancellation Request Status */}
              {order.cancellationRequest && (
                <div className={`border rounded-lg shadow-sm p-6 ${
                  order.cancellationRequest.status === 'pending' 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : order.cancellationRequest.status === 'approved'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      order.cancellationRequest.status === 'pending'
                        ? 'bg-yellow-100'
                        : order.cancellationRequest.status === 'approved'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      {order.cancellationRequest.status === 'pending' ? (
                        <Clock className={`w-5 h-5 ${
                          order.cancellationRequest.status === 'pending' ? 'text-yellow-600' : ''
                        }`} />
                      ) : order.cancellationRequest.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className={`text-lg font-semibold mb-2 ${
                        order.cancellationRequest.status === 'pending'
                          ? 'text-yellow-900'
                          : order.cancellationRequest.status === 'approved'
                          ? 'text-green-900'
                          : 'text-red-900'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {order.cancellationRequest.status === 'pending' && 'Cancellation Request Pending'}
                        {order.cancellationRequest.status === 'approved' && 'Cancellation Request Approved'}
                        {order.cancellationRequest.status === 'rejected' && 'Cancellation Request Rejected'}
                      </h2>
                      <p className={`mb-2 ${
                        order.cancellationRequest.status === 'pending'
                          ? 'text-yellow-800'
                          : order.cancellationRequest.status === 'approved'
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {order.cancellationRequest.status === 'pending' && 
                          `Your cancellation request is waiting for seller approval. Requested on ${formatDate(order.cancellationRequest.requestedAt)}`}
                        {order.cancellationRequest.status === 'approved' && 
                          'The seller has approved your cancellation request. Your order has been cancelled.'}
                        {order.cancellationRequest.status === 'rejected' && 
                          'The seller has rejected your cancellation request. The order will continue as planned.'}
                      </p>
                      {order.cancellationRequest.reason && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Your Reason:
                          </p>
                          <p className="text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {order.cancellationRequest.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Refusal Reason */}
              {order.status === 'cancelled' && order.refusalReason && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg shadow-sm p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-orange-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Delivery Refused
                      </h2>
                      <p className="text-orange-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        You refused this delivery on {order.refusalDate && formatDate(order.refusalDate)}
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <p className="text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Reason:
                        </p>
                        <p className="text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {order.refusalReason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Subtotal</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Delivery Fee</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {formatCurrency(order.deliveryFee)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Total</span>
                      <span className="font-bold text-lg text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatCurrency(order.finalAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 pt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Average price per item: {formatCurrency(order.summary.avgItemPrice)}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block" style={{ fontFamily: 'Poppins, sans-serif' }}>Payment Method</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {order.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block" style={{ fontFamily: 'Poppins, sans-serif' }}>Payment Status</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-1 ${paymentStatusColors[order.paymentStatus]}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seller Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block" style={{ fontFamily: 'Poppins, sans-serif' }}>Seller Name</span>
                    <span className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {order.sellerName}
                    </span>
                  </div>
                  {order.canContactSeller && (
                    <button 
                      onClick={handleContactSeller}
                      disabled={contacting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {contacting ? 'Contacting...' : 'Contact Seller'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Actions
                </h2>
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
                  
                  {order.status === 'shipped' && (
                    <>
                      <button
                        onClick={handleReceiveOrder}
                        disabled={receiving || refusing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        {receiving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {receiving ? 'Processing...' : 'Order Received'}
                        </span>
                      </button>
                      
                      <button
                        onClick={handleRefuseDelivery}
                        disabled={receiving || refusing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {refusing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {refusing ? 'Processing...' : 'Refuse Delivery'}
                        </span>
                      </button>
                    </>
                  )}
                  
                  {order.canCancel && !order.cancellationRequest?.status && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                      </span>
                    </button>
                  )}
                  
                  {order.cancellationRequest?.status === 'pending' && (
                    <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-center text-sm">
                      <Clock className="w-4 h-4 inline mr-2" />
                      <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Cancellation request pending
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tracking Tab */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Order Tracking
              </h2>
              
              <div className="relative">
                {order.trackingSteps.map((step, index) => (
                  <div key={step.status} className="relative flex items-start pb-8 last:pb-0">
                    {/* Timeline Line */}
                    {index < order.trackingSteps.length - 1 && (
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
                        {step.timestamp && (
                          <span className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {formatDate(step.timestamp)}
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
                        This order has been cancelled. If you have any questions, please contact our support team.
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
                        Your order is expected to arrive by {formatDate(order.estimatedDelivery)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={(open) => !cancelling && setShowCancelDialog(open)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Cancel Order?
          </DialogTitle>
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            
            {/* Message */}
            <p className="text-gray-600 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {order?.status === 'preparing' 
                ? 'Are you sure you want to cancel this order? This action cannot be undone.'
                : 'Please provide a reason for cancellation. The seller will review your request.'}
            </p>
            
            {/* Reason Textarea - Only show for confirmed/preparing/shipped orders */}
            {order && ['confirmed', 'preparing', 'shipped'].includes(order.status) && (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please explain why you want to cancel this order..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  rows={4}
                  maxLength={500}
                  disabled={cancelling}
                />
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {cancelReason.length}/500 characters
                </p>
              </div>
            )}
            
            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                }}
                disabled={cancelling}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                No, Keep It
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {cancelling ? 'Processing...' : order?.status === 'preparing' ? 'Yes, Cancel' : 'Submit Request'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Order Confirmation Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={(open) => !receiving && setShowReceiveDialog(open)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Confirm Order Received?
          </DialogTitle>
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            {/* Message */}
            <p className="text-gray-600 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Have you received your order in good condition? This will mark the order as delivered.
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowReceiveDialog(false)}
                disabled={receiving}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Not Yet
              </button>
              <button
                onClick={confirmReceiveOrder}
                disabled={receiving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {receiving ? 'Processing...' : 'Yes, Received'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refuse Delivery Dialog */}
      <Dialog open={showRefuseDialog} onOpenChange={(open) => !refusing && setShowRefuseDialog(open)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Refuse Delivery?
          </DialogTitle>
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
            
            {/* Message */}
            <p className="text-gray-600 text-center mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Please tell us why you're refusing this delivery. The seller will be notified.
            </p>
            
            {/* Reason Input */}
            <textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              placeholder="e.g., Damaged items, wrong order, quality issues..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              style={{ fontFamily: 'Poppins, sans-serif' }}
              rows={4}
              disabled={refusing}
            />
            
            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowRefuseDialog(false)}
                disabled={refusing}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRefuseDelivery}
                disabled={refusing || !refuseReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {refusing ? 'Processing...' : 'Refuse Delivery'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl p-8">
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {resultDialog.success ? 'Success!' : 'Error'}
          </DialogTitle>
          <div className="flex flex-col items-center gap-4">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              resultDialog.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {resultDialog.success ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            
            {/* Message */}
            <p className="text-gray-600 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {resultDialog.message}
            </p>
            
            {/* Button */}
            <button
              onClick={() => setResultDialog({ open: false, success: false, message: '' })}
              className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}