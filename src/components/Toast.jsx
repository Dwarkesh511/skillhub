import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification ${type}`}>
      {type === 'success' ? (
        <CheckCircle size={20} color="#10b981" />
      ) : type === 'info' ? (
        <Info size={20} color="#3b82f6" />
      ) : (
        <AlertCircle size={20} color="#ef4444" />
      )}
      <span>{message}</span>
    </div>
  );
};
