'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Phone } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { makeCall, getDIDs } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';

type CallFormData = {
  to: string;
  transfer_number: string;
  from: string;
  trunk?: string;
  context?: string;
};

type DID = {
  id: number;
  phoneNumber: string;
  description: string;
  isActive: boolean;
};

export default function CallsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dids, setDids] = useState<DID[]>([]);
  const [currentCallId, setCurrentCallId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CallFormData>();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchDIDs = async () => {
      try {
        const response = await getDIDs(1, 100, true);
        setDids(response.dids);
      } catch (error) {
        console.error('Error fetching DIDs:', error);
        toast.error('Failed to load DIDs');
      }
    };

    fetchDIDs();
  }, [isAuthenticated, router]);

  const onSubmit = async (data: CallFormData) => {
    setIsLoading(true);
    
    try {
      const response = await makeCall(data);
      setCurrentCallId(response.callId);
      toast.success('Call initiated successfully');
    } catch (error) {
      console.error('Call error:', error);
      toast.error('Failed to make call');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Make Call</h1>
        
        <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Call Information</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Enter the phone numbers to initiate a call.
                </p>
                {currentCallId && (
                  <div className="mt-6 p-4 border rounded-md bg-green-50 border-green-200">
                    <h4 className="text-sm font-medium text-green-800">Current Call</h4>
                    <p className="mt-1 text-sm text-green-700">Call ID: {currentCallId}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-5 md:mt-0 md:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      id="to"
                      type="text"
                      label="Destination Number"
                      placeholder="Enter phone number to call"
                      error={errors.to?.message}
                      {...register('to', { 
                        required: 'Destination number is required',
                        pattern: {
                          value: /^[0-9]{10,15}$/,
                          message: 'Please enter a valid phone number',
                        },
                      })}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      id="transfer_number"
                      type="text"
                      label="Transfer Number"
                      placeholder="Enter transfer number"
                      error={errors.transfer_number?.message}
                      {...register('transfer_number', { 
                        required: 'Transfer number is required',
                        pattern: {
                          value: /^[0-9]{10,15}$/,
                          message: 'Please enter a valid phone number',
                        },
                      })}
                    />
                  </div>
                  
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">From (Caller ID)</label>
                    <select
                      id="from"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      {...register('from', { required: 'Caller ID is required' })}
                    >
                      <option value="">Select a DID number</option>
                      {dids.map((did) => (
                        <option key={did.id} value={did.phoneNumber}>
                          {did.phoneNumber} - {did.description}
                        </option>
                      ))}
                    </select>
                    {errors.from && <p className="mt-1 text-sm text-red-600">{errors.from.message}</p>}
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      id="trunk"
                      type="text"
                      label="Trunk (Optional)"
                      placeholder="Enter trunk"
                      error={errors.trunk?.message}
                      {...register('trunk')}
                    />
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      id="context"
                      type="text"
                      label="Context (Optional)"
                      placeholder="Enter context"
                      error={errors.context?.message}
                      {...register('context')}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="mr-3"
                    onClick={() => {
                      setValue('to', '');
                      setValue('transfer_number', '');
                      setValue('from', '');
                      setValue('trunk', '');
                      setValue('context', '');
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Make Call
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 