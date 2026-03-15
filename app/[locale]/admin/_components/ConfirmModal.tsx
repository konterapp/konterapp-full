'use client';

import { X, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ConfirmModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   title: string;
   message: string | React.ReactNode;
   confirmText?: string;
   cancelText?: string;
   type?: 'danger' | 'warning' | 'info' | 'success';
   isLoading?: boolean;
}

export default function ConfirmModal({
   isOpen,
   onClose,
   onConfirm,
   title,
   message,
   confirmText,
   cancelText,
   type = 'danger',
   isLoading = false,
}: ConfirmModalProps) {
   const actualConfirmText = confirmText || 'Konfirmasi';
   const actualCancelText = cancelText || 'Batal';
   if (!isOpen) return null;

   const handleConfirm = () => {
      onConfirm();
   };

   const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   const bgColor = type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-yellow-50' : type === 'success' ? 'bg-green-50' : 'bg-blue-50';
   const iconColor = type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : type === 'success' ? 'text-green-600' : 'text-blue-600';
   const buttonVariant = type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'primary';

   return (
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
         onClick={handleBackdropClick}
      >
         <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className={`${bgColor} px-6 py-4 rounded-t-lg flex items-center justify-between`}>
               <div className="flex items-center space-x-3">
                  <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
               </div>
               <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            <div className="px-6 py-4">
               <div className="text-gray-700">{message}</div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
               <Button
                  onClick={onClose}
                  disabled={isLoading}
                  variant="light"
               >
                  {actualCancelText}
               </Button>
               <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  variant={buttonVariant as 'danger' | 'warning' | 'success' | 'primary'}
                  isLoading={isLoading}
               >
                  {actualConfirmText}
               </Button>
            </div>
         </div>
      </div>
   );
}
