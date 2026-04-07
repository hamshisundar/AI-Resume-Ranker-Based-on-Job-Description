import React, { useEffect, useState } from "react";
import { checkHealth } from "../api/client";
import { Loader2 } from "lucide-react";

const BackendStatus = () => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const verifyHealth = async () => {
      try {
        await checkHealth();
        setStatus("ok");
      } catch {
        setStatus("error");
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 tabular-nums shrink-0" title="API health check">
      <span className="text-slate-400">API</span>
      {status === "checking" && (
        <span className="flex items-center gap-1.5 text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden />
          <span>…</span>
        </span>
      )}
      {status === "ok" && (
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span>up</span>
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
          <span>down</span>
        </span>
      )}
    </div>
  );
};

export default BackendStatus;
