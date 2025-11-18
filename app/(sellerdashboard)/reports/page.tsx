"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Package, 
  Star, 
  ShoppingCart, 
  Banknote, 
  AlertTriangle, 
  Calendar,
  Download,
  Printer,
  FileText,
  DollarSign
} from "lucide-react";
import { useSellerStats, formatCurrency, getMonthName } from "@/hooks/useSellerReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface PrintableReportData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  topProducts: Array<{
    _id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

interface ReportFilters {
  period: 'custom' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  month?: number;
  quarter?: number;
  year: number;
}

const ReportPage = () => {
  const { stats, loading, error, refresh } = useSellerStats();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showPrintableReports, setShowPrintableReports] = useState(false);
  const [printableData, setPrintableData] = useState<PrintableReportData | null>(null);
  const [loadingPrintable, setLoadingPrintable] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const quarters = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' }
  ];

  // Auto-generate report when switching to printable reports
  useEffect(() => {
    if (showPrintableReports && !printableData && !loadingPrintable) {
      generatePrintableReport();
    }
  }, [showPrintableReports]);

  // Fetch seller profile data - EXACT same as seller profile page
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const response = await fetch('/api/seller/profile', {
          credentials: 'include' // Use HTTP-only cookies instead of localStorage
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Seller profile data:', data); // Debug
          setSellerProfile({
            name: data.seller.name,
            email: data.seller.email,
            phone: data.seller.phone
          });
        } else {
          console.error('Failed to fetch profile:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error);
      }
    };

    if (user) {
      fetchSellerProfile();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handlePeriodChange = (period: string) => {
    const newFilters = { ...filters, period: period as ReportFilters['period'] };
    
    if (period === 'monthly' && filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      newFilters.startDate = startDate.toISOString().split('T')[0];
      newFilters.endDate = endDate.toISOString().split('T')[0];
    } else if (period === 'quarterly' && filters.quarter && filters.year) {
      const startMonth = (filters.quarter - 1) * 3;
      const startDate = new Date(filters.year, startMonth, 1);
      const endDate = new Date(filters.year, startMonth + 3, 0);
      newFilters.startDate = startDate.toISOString().split('T')[0];
      newFilters.endDate = endDate.toISOString().split('T')[0];
    } else if (period === 'yearly' && filters.year) {
      const startDate = new Date(filters.year, 0, 1);
      const endDate = new Date(filters.year, 11, 31);
      newFilters.startDate = startDate.toISOString().split('T')[0];
      newFilters.endDate = endDate.toISOString().split('T')[0];
    }
    
    setFilters(newFilters);
  };

  const handleMonthChange = (month: string) => {
    const monthNum = parseInt(month);
    const startDate = new Date(filters.year, monthNum - 1, 1);
    const endDate = new Date(filters.year, monthNum, 0);
    
    setFilters({
      ...filters,
      month: monthNum,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const handleQuarterChange = (quarter: string) => {
    const quarterNum = parseInt(quarter);
    const startMonth = (quarterNum - 1) * 3;
    const startDate = new Date(filters.year, startMonth, 1);
    const endDate = new Date(filters.year, startMonth + 3, 0);
    
    setFilters({
      ...filters,
      quarter: quarterNum,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    let startDate: Date;
    let endDate: Date;

    if (filters.period === 'monthly' && filters.month) {
      startDate = new Date(yearNum, filters.month - 1, 1);
      endDate = new Date(yearNum, filters.month, 0);
    } else if (filters.period === 'quarterly' && filters.quarter) {
      const startMonth = (filters.quarter - 1) * 3;
      startDate = new Date(yearNum, startMonth, 1);
      endDate = new Date(yearNum, startMonth + 3, 0);
    } else {
      startDate = new Date(yearNum, 0, 1);
      endDate = new Date(yearNum, 11, 31);
    }
    
    setFilters({
      ...filters,
      year: yearNum,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const generatePrintableReport = async () => {
    setLoadingPrintable(true);
    try {
      console.log('Generating report with filters:', filters);
      
      // Get token for authentication
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      
      const response = await fetch('/api/seller/reports/printable', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          startDate: filters.startDate,
          endDate: filters.endDate
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Report data received:', data);
        setPrintableData(data);
      } else {
        const errorData = await response.json();
        console.error('Failed to generate printable report:', errorData);
        alert(`Failed to generate report: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating printable report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoadingPrintable(false);
    }
  };

  const printReport = () => {
    // Hide all non-print elements
    const printStyle = document.createElement('style');
    printStyle.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        
        #report-content,
        #report-content * {
          visibility: visible;
        }
        
        #report-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        
        .no-print {
          display: none !important;
        }
        
        /* Hide navigation, sidebar, and other page elements */
        nav, .sidebar, .navigation, .header, .footer {
          display: none !important;
        }
        
        /* Page break settings */
        .page-break-before {
          page-break-before: always;
        }
        
        .page-break-after {
          page-break-after: always;
        }
        
        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
      }
    `;
    
    document.head.appendChild(printStyle);
    window.print();
    
    // Remove the style after printing
    setTimeout(() => {
      document.head.removeChild(printStyle);
    }, 1000);
  };

  const downloadReport = () => {
    const reportContent = generateReportContent();
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${filters.startDate}-to-${filters.endDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReportContent = () => {
    const printDate = new Date().toLocaleString();
    const periodLabel = getPeriodLabel();
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${periodLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #103C2E; padding-bottom: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .summary-item h3 { margin: 0 0 10px 0; color: #103C2E; }
            .summary-item p { margin: 0; font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #103C2E; color: white; }
            .print-info { text-align: right; font-size: 12px; color: #666; margin-bottom: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="print-info">Generated on: ${printDate}</div>
          <div class="header">
            <h1>HarvestHub Sales Report</h1>
            <h2>${periodLabel}</h2>
            <p>${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}</p>
          </div>
          
          <div class="summary-grid">
            <div class="summary-item">
              <h3>Total Sales</h3>
              <p>₱${(printableData?.totalRevenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div class="summary-item">
              <h3>Total Orders</h3>
              <p>${printableData?.totalOrders.toLocaleString() || '0'}</p>
            </div>
            <div class="summary-item">
              <h3>Products Sold</h3>
              <p>${printableData?.totalProducts.toLocaleString() || '0'}</p>
            </div>
            <div class="summary-item">
              <h3>Average Order Value</h3>
              <p>₱${printableData?.averageOrderValue.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          ${printableData?.topProducts && printableData.topProducts.length > 0 ? `
            <h3>Top Selling Products</h3>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${printableData.topProducts.map(product => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.totalSold}</td>
                    <td>₱${product.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </body>
      </html>
    `;
  };

  const getPeriodLabel = () => {
    if (filters.period === 'monthly' && filters.month) {
      return `${months[filters.month - 1]} ${filters.year}`;
    } else if (filters.period === 'quarterly' && filters.quarter) {
      return `Q${filters.quarter} ${filters.year}`;
    } else if (filters.period === 'yearly') {
      return `Year ${filters.year}`;
    } else {
      return `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#ECFDF5] mt-3 sm:mt-4 mb-3 sm:mb-4 mx-2 sm:mx-3 p-3 sm:p-4 rounded-lg shadow-gray-400 shadow-sm min-h-screen">
        <div className="flex items-center gap-2 mt-4 sm:mt-6 ml-1 sm:ml-2 mb-4 sm:mb-6">
          <h1 className="text-[#103C2E] font-bold text-xl sm:text-2xl lg:text-3xl ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Reports</h1>
        </div>
        
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#ECFDF5] mt-3 sm:mt-4 mb-3 sm:mb-4 mx-2 sm:mx-3 p-3 sm:p-4 rounded-lg shadow-gray-400 shadow-sm min-h-screen">
        <div className="flex items-center gap-2 mt-4 sm:mt-6 ml-1 sm:ml-2 mb-4 sm:mb-6">
          <h1 className="text-[#103C2E] font-bold text-xl sm:text-2xl lg:text-3xl ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Reports</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-red-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Error Loading Reports</h3>
          </div>
          <p className="text-red-700 text-sm mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-[#ECFDF5] mt-3 sm:mt-4 mb-3 sm:mb-4 mx-2 sm:mx-3 p-3 sm:p-4 rounded-lg shadow-gray-400 shadow-sm min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 mt-4 sm:mt-6 ml-1 sm:ml-2">
          <h1 className="text-[#103C2E] font-bold text-xl sm:text-2xl lg:text-3xl ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {showPrintableReports ? 'Printable Reports' : 'Reports Dashboard'}
          </h1>
        </div>
        
        <div className="flex gap-2">
          {!showPrintableReports ? (
            <>
              <Button
                onClick={() => setShowPrintableReports(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm no-print"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Printable Reports
              </Button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 no-print"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setShowPrintableReports(false)}
                variant="outline"
                className="px-3 py-2 text-sm no-print"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Back to Dashboard
              </Button>
              {printableData && (
                <>
                  <Button onClick={printReport} variant="outline" className="hidden sm:flex no-print">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={downloadReport} variant="outline" className="hidden sm:flex no-print">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Printable Reports Section */}
      {showPrintableReports && (
        <>
          {/* Filters */}
          <Card className="mb-6 no-print">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="period">Report Period</Label>
                  <Select value={filters.period} onValueChange={handlePeriodChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filters.period === 'monthly' && (
                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Select value={filters.month?.toString()} onValueChange={handleMonthChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filters.period === 'quarterly' && (
                  <div>
                    <Label htmlFor="quarter">Quarter</Label>
                    <Select value={filters.quarter?.toString()} onValueChange={handleQuarterChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {quarters.map((quarter) => (
                          <SelectItem key={quarter.value} value={quarter.value.toString()}>
                            {quarter.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filters.period !== 'custom' && (
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select value={filters.year.toString()} onValueChange={handleYearChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filters.period === 'custom' && (
                  <>
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={generatePrintableReport} disabled={loadingPrintable}>
                  {loadingPrintable ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Printable Report Content */}
          {printableData && (
            <div id="report-content" className="space-y-6 print-content bg-white p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-600 mb-2">HARVEST HUB</h1>
                <p className="text-lg text-gray-500">Sales Report</p>
                <div className="mt-4 text-right">
                  <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Report Title */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-black">SALES REPORT</h2>
              </div>

              {/* Report Details and Seller Information in 2-column layout */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Report Details */}
                <div className="border border-gray-300 p-4">
                  <h3 className="font-bold text-black mb-4">Report Details:</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Period:</strong> {getPeriodLabel()}</div>
                    <div><strong>Date Range:</strong> {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}</div>
                    <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
                    <div><strong>Report Type:</strong> {filters.period.charAt(0).toUpperCase() + filters.period.slice(1)} Report</div>
                  </div>
                </div>

                {/* Seller Information */}
                <div className="border border-gray-300 p-4">
                  <h3 className="font-bold text-black mb-4">Seller Information:</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {sellerProfile?.name || user?.name || user?.firstName || 'N/A'}</div>
                    <div><strong>Business Email:</strong> {sellerProfile?.email || user?.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> {sellerProfile?.phone || user?.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Top Products Table */}
              {printableData.topProducts && printableData.topProducts.length > 0 && (
                <div className="mb-8">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">Rank</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">Product Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">Quantity Sold</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-bold">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printableData.topProducts.map((product, index) => (
                        <tr key={product._id}>
                          <td className="border border-gray-300 px-4 py-2">#{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">{product.name}</td>
                          <td className="border border-gray-300 px-4 py-2">{product.totalSold}</td>
                          <td className="border border-gray-300 px-4 py-2">₱{product.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Information Box */}
              <div className="border border-gray-300 mb-8">
                <div className="bg-gray-100 px-4 py-2">
                  <h3 className="font-bold text-black">Summary Information:</h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span>₱{printableData.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span>{printableData.totalOrders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Products Sold:</span>
                    <span>{printableData.totalProducts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Order Value:</span>
                    <span>₱{printableData.averageOrderValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Sales Summary Box */}
              <div className="border border-gray-300">
                <div className="bg-gray-100 px-4 py-2">
                  <h3 className="font-bold text-black">Sales Summary:</h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Gross Sales:</span>
                    <span>₱{printableData.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of Orders:</span>
                    <span>{printableData.totalOrders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">
                    <span>TOTAL SALES:</span>
                    <span>₱{printableData.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 text-sm text-gray-600">
                <p>Thank you for using HarvestHub!</p>
                <p>Supporting local farmers and bringing fresh produce to communities.</p>
                <p>For support: support@harvesthub.ph | Visit us at harvesthub.ph</p>
                <p className="mt-2 font-mono">Report #{getPeriodLabel().replace(/\s/g, '-')}-{new Date().getTime().toString().slice(-6)}</p>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!printableData && !loadingPrintable && (
            <Card className="no-print">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
                <p className="text-gray-600">Select your filters and click "Generate Report" to view your sales data.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Overview Cards */}
      {!showPrintableReports && (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Sales</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {formatCurrency(stats.overview.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrency(stats.recentActivity.recentRevenue)} this month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Orders</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.overview.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {stats.recentActivity.recentOrders} this month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Products</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.overview.totalProducts}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            {stats.products.lowStock > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-orange-600 mr-1" />
                <span className="text-orange-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {stats.products.lowStock} low stock
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  All products in stock
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Average Rating</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.overview.averageRating > 0 ? stats.overview.averageRating.toFixed(1) : 'No ratings yet'}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            {stats.overview.averageRating > 0 ? (
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= stats.overview.averageRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <span className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Get your first review to see ratings
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charts and Additional Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Order Status
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.orderStats)
              .filter(([status]) => status !== 'completed')
              .map(([status, count]) => {
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                preparing: 'bg-blue-100 text-blue-800',
                shipped: 'bg-purple-100 text-purple-800',
                delivered: 'bg-green-100 text-green-800'
              };
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Monthly Revenue (Last 6 Months)
          </h3>
          <div className="space-y-3">
            {stats.monthlyRevenue.slice(-6).map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {getMonthName(month._id.month)} {month._id.year}
                </span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {formatCurrency(month.revenue)}
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {month.orderCount} orders
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Top Selling Products
        </h3>
        
        {stats.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Product
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Units Sold
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={product._id} className="border-b border-gray-100">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {product.totalSold}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatCurrency(product.totalRevenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No sales data available yet
            </p>
          </div>
        )}
      </div>
      </>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide all elements by default */
          body * {
            visibility: hidden;
          }
          
          /* Show only the report content */
          #report-content,
          #report-content * {
            visibility: visible;
          }
          
          /* Position the report content properly */
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          /* Hide elements with no-print class */
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Show print-only elements */
          .print\\:block {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Basic print styling */
          body {
            font-size: 12pt;
            line-height: 1.4;
            color: black;
            background: white;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: black;
            page-break-after: avoid;
          }
          
          /* Table styling for print */
          table {
            border-collapse: collapse;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          /* Page break controls */
          .page-break-before {
            page-break-before: always;
          }
          
          .page-break-after {
            page-break-after: always;
          }
          
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          
          /* Card styling for print */
          .print-content .grid {
            display: grid;
          }
          
          .print-content .gap-4 {
            gap: 1rem;
          }
          
          /* Remove shadows and borders for clean print */
          .print-content [class*="shadow"],
          .print-content [class*="border"] {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportPage;
