import React, { useEffect, useState } from 'react';
import { checkHealth } from '../api/client';
import { CircleCheck, CircleX, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const BackendStatus = () => {
  const [status, setStatus] = useState('checking'); // checking, ok, error

  useEffect(() => {
    const verifyHealth = async () => {
      try {
        await checkHealth();
        setStatus('ok');
      } catch (error) {
        setStatus('error');
      }
    };

    verifyHealth();
    // Poll every 30 seconds
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <span>Backend:</span>
      {status === 'checking' && (
        <span className="flex items-center gap-1 text-yellow-600">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking...
        </span>
      )}
      {status === 'ok' && (
        <span className="flex items-center gap-1 text-green-600">
          <CircleCheck className="w-4 h-4" /> Online
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-red-600">
          <CircleX className="w-4 h-4" /> Offline
        </span>
      )}
    </div>
  );
};

export default BackendStatus;
