"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] font-bold text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
    >
      {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
