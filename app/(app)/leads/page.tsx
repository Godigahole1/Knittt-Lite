'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Upload, User, CheckCircle, XCircle, PhoneOutgoing, Filter } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { getLeads, uploadLeads } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';

type Lead = {
  id: number;
  tenantId: string;
  phone: string;
  name: string;
  email: string;
  additionalData: Record<string, any>;
  attempts: number;
  lastAttempt: string | null;
  callDurations: number[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

type UploadFormData = {
  fileContent: string;
  sortOrder: 'oldest' | 'fewest';
  autoDelete: boolean;
};

export default function LeadsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadIsLoading, setUploadIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormData>({
    defaultValues: {
      sortOrder: 'oldest',
      autoDelete: false,
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchLeads(currentPage);
  }, [isAuthenticated, router, currentPage, filterStatus]);

  const fetchLeads = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await getLeads(page, 10, filterStatus || undefined);
      setLeads(response.leads);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const onUploadSubmit = async (data: UploadFormData) => {
    setUploadIsLoading(true);
    
    try {
      await uploadLeads(data.fileContent, {
        sortOrder: data.sortOrder,
        autoDelete: data.autoDelete,
      });
      
      toast.success('Leads uploaded successfully');
      setIsUploading(false);
      fetchLeads(1); // Refresh leads
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload leads');
    } finally {
      setUploadIsLoading(false);
    }
  };

  const onCsvInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // We'll handle the CSV content directly in the form
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const file = e.target.files[0];
        const fileContent = await file.text();
        // Set the textarea content directly
        const formValues = { 
          fileContent,
          sortOrder: 'oldest' as const,
          autoDelete: false
        };
        
        await onUploadSubmit(formValues);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Failed to read CSV file');
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <Button
            onClick={() => setIsUploading(!isUploading)}
            variant="primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Leads
          </Button>
        </div>

        {isUploading && (
          <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Upload Leads</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Upload your leads from a CSV file or paste the CSV content directly.
                </p>
                <div className="mt-4">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('text')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        uploadMethod === 'text' 
                          ? 'bg-brand text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Paste CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        uploadMethod === 'file' 
                          ? 'bg-brand text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                {uploadMethod === 'text' ? (
                  <form onSubmit={handleSubmit(onUploadSubmit)}>
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">CSV Content</label>
                        <textarea
                          id="fileContent"
                          rows={10}
                          className="shadow-sm focus:ring-brand focus:border-brand block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="name,phone,email&#10;John Doe,8001234567,john@example.com"
                          {...register('fileContent', { 
                            required: 'CSV content is required',
                            onChange: onCsvInputChange,
                          })}
                        ></textarea>
                        {errors.fileContent && <p className="mt-1 text-sm text-red-600">{errors.fileContent.message}</p>}
                      </div>
                      
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <select
                          id="sortOrder"
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand sm:text-sm"
                          {...register('sortOrder')}
                        >
                          <option value="oldest">Oldest First</option>
                          <option value="fewest">Fewest Attempts First</option>
                        </select>
                      </div>
                      
                      <div className="col-span-6 sm:col-span-3">
                        <div className="flex items-start mt-5">
                          <div className="flex items-center h-5">
                            <input
                              id="autoDelete"
                              type="checkbox"
                              className="focus:ring-brand h-4 w-4 text-brand border-gray-300 rounded"
                              {...register('autoDelete')}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="autoDelete" className="font-medium text-gray-700">Auto Delete</label>
                            <p className="text-gray-500">Delete leads after successful contact</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        className="mr-3"
                        onClick={() => setIsUploading(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={uploadIsLoading}
                      >
                        Upload
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand file:bg-opacity-10 file:text-brand hover:file:bg-brand hover:file:bg-opacity-20"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          The CSV file should have a header row with column names. Required columns: name, phone, email
                        </p>
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium text-gray-700">Example CSV format:</h4>
                          <pre className="mt-1 text-xs text-gray-600">name,phone,email
John Doe,8001234567,john@example.com
Jane Smith,8007654321,jane@example.com</pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        className="mr-3"
                        onClick={() => setIsUploading(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="p-4 border-b border-gray-200 sm:px-6">
              <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Lead List</h3>
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-400 mr-2" />
                  <select
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand sm:text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading some leads.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <li key={lead.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <User className="h-10 w-10 rounded-full bg-gray-100 p-2 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-brand">{lead.name}</div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a href={`tel:${lead.phone}`} className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-brand hover:bg-brand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand">
                              <PhoneOutgoing className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <span className="truncate">{lead.phone}</span>
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <span className="ml-1">
                                {lead.attempts} {lead.attempts === 1 ? 'attempt' : 'attempts'}
                              </span>
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                              ${lead.status === 'new' ? 'bg-brand bg-opacity-10 text-brand' : 
                                lead.status === 'contacted' ? 'bg-brand bg-opacity-10 text-brand' :
                                lead.status === 'qualified' ? 'bg-brand bg-opacity-10 text-brand' :
                                lead.status === 'converted' ? 'bg-brand bg-opacity-10 text-brand' :
                                'bg-brand bg-opacity-10 text-brand'
                              }"
                            >
                              {lead.status === 'converted' ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : lead.status === 'rejected' ? (
                                <XCircle className="mr-1 h-3 w-3" />
                              ) : null}
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span> pages
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-brand focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                ${currentPage === pageNum
                                  ? 'z-10 bg-brand bg-opacity-10 border-brand text-brand'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-brand focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 