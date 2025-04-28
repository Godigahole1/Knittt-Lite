'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, PhoneOutgoing, CheckCircle, XCircle, Edit } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { getDIDs, addDID, updateDID } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';

type DID = {
  id: number;
  tenantId: string;
  phoneNumber: string;
  description: string;
  areaCode: string;
  state: string;
  isActive: boolean;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
};

type AddDIDFormData = {
  phoneNumber: string;
  description: string;
  areaCode?: string;
  state?: string;
};

type UpdateDIDFormData = {
  description: string;
  isActive: boolean;
};

export default function DIDsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [dids, setDids] = useState<DID[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDID, setSelectedDID] = useState<DID | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  const addForm = useForm<AddDIDFormData>();
  const editForm = useForm<UpdateDIDFormData>();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchDIDs(currentPage);
  }, [isAuthenticated, router, currentPage, filterActive]);

  const fetchDIDs = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await getDIDs(page, 10, filterActive);
      setDids(response.dids);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error('Error fetching DIDs:', error);
      toast.error('Failed to load DIDs');
    } finally {
      setIsLoading(false);
    }
  };

  const onAddSubmit = async (data: AddDIDFormData) => {
    try {
      await addDID(data);
      toast.success('DID added successfully');
      addForm.reset();
      setIsAdding(false);
      fetchDIDs(1);
    } catch (error) {
      console.error('Error adding DID:', error);
      toast.error('Failed to add DID');
    }
  };

  const startEditing = (did: DID) => {
    setSelectedDID(did);
    editForm.reset({
      description: did.description,
      isActive: did.isActive,
    });
    setIsEditing(true);
  };

  const onEditSubmit = async (data: UpdateDIDFormData) => {
    if (!selectedDID) return;

    try {
      await updateDID(selectedDID.id, data);
      toast.success('DID updated successfully');
      editForm.reset();
      setIsEditing(false);
      setSelectedDID(null);
      fetchDIDs(currentPage);
    } catch (error) {
      console.error('Error updating DID:', error);
      toast.error('Failed to update DID');
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Direct Inward Dialing (DIDs)</h1>
          {user?.role === 'admin' && (
            <Button onClick={() => setIsAdding(!isAdding)} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add DID
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Add New DID</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add a new Direct Inward Dialing number to your account.
                </p>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={addForm.handleSubmit(onAddSubmit)}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="phoneNumber"
                        type="text"
                        label="Phone Number"
                        placeholder="e.g., 8001234567"
                        error={addForm.formState.errors.phoneNumber?.message}
                        {...addForm.register('phoneNumber', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^[0-9]{10,15}$/,
                            message: 'Please enter a valid phone number',
                          },
                        })}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="description"
                        type="text"
                        label="Description"
                        placeholder="e.g., Main Office Line"
                        error={addForm.formState.errors.description?.message}
                        {...addForm.register('description', { required: 'Description is required' })}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="areaCode"
                        type="text"
                        label="Area Code (Optional)"
                        placeholder="e.g., 800"
                        error={addForm.formState.errors.areaCode?.message}
                        {...addForm.register('areaCode', {
                          pattern: {
                            value: /^[0-9]{3}$/,
                            message: 'Area code should be 3 digits',
                          },
                        })}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="state"
                        type="text"
                        label="State (Optional)"
                        placeholder="e.g., CA"
                        error={addForm.formState.errors.state?.message}
                        {...addForm.register('state')}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="mr-3"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={addForm.formState.isSubmitting}
                    >
                      Add DID
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isEditing && selectedDID && (
          <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Edit DID</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Update DID: {formatPhoneNumber(selectedDID.phoneNumber)}
                </p>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <Input
                        id="description"
                        type="text"
                        label="Description"
                        placeholder="Enter description"
                        error={editForm.formState.errors.description?.message}
                        {...editForm.register('description', { required: 'Description is required' })}
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="isActive"
                            type="checkbox"
                            className="focus:ring-brand h-4 w-4 text-brand border-gray-300 rounded"
                            {...editForm.register('isActive')}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="isActive" className="font-medium text-gray-700">Active</label>
                          <p className="text-gray-500">Enable or disable this DID</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="mr-3"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedDID(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={editForm.formState.isSubmitting}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="p-4 border-b border-gray-200 sm:px-6">
              <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
                <h3 className="text-lg leading-6 font-medium text-gray-900">DID List</h3>
                <div className="flex items-center">
                  <label htmlFor="filterActive" className="mr-2 text-sm font-medium text-gray-700">Status:</label>
                  <select
                    id="filterActive"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand sm:text-sm"
                    value={filterActive === undefined ? '' : filterActive ? 'active' : 'inactive'}
                    onChange={(e) => {
                      if (e.target.value === '') setFilterActive(undefined);
                      else setFilterActive(e.target.value === 'active');
                    }}
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
              </div>
            ) : dids.length === 0 ? (
              <div className="text-center py-12">
                <PhoneOutgoing className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No DIDs</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a DID.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200">
                  {dids.map((did) => (
                    <li key={did.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <PhoneOutgoing className={`h-8 w-8 rounded-full p-1 ${did.isActive ? 'bg-brand bg-opacity-10 text-brand' : 'bg-brand bg-opacity-10 text-brand'}`} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-brand">{formatPhoneNumber(did.phoneNumber)}</div>
                              <div className="text-sm text-gray-500">{did.description}</div>
                            </div>
                          </div>
                          {user?.role === 'admin' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditing(did)}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-brand hover:bg-brand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            {did.areaCode && (
                              <p className="flex items-center text-sm text-gray-500">
                                Area Code: {did.areaCode}
                              </p>
                            )}
                            {did.state && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                State: {did.state}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center sm:mt-0">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              did.isActive 
                                ? 'bg-brand bg-opacity-10 text-brand' 
                                : 'bg-brand bg-opacity-10 text-brand'
                            }`}>
                              {did.isActive ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                            {did.usageCount > 0 && (
                              <span className="ml-2 text-sm text-gray-500">
                                Used {did.usageCount} times
                              </span>
                            )}
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
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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