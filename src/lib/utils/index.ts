import { clsx, type ClassValue } from "clsx"
import { toast } from "sonner";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };



  export  const downloadFromHistory = (item: any) => {
    toast.success("Opening from history...", {
      id:"history-open"
,      dismissible: true
    });
    if (!item.file?.blob) return;
    const url = URL.createObjectURL(item.file.blob);
    window.open(url, "_blank");
    toast.dismiss("history-open");
  };
