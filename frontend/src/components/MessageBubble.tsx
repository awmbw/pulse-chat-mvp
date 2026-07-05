import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { importFileKey, decryptFile } from "@/lib/crypto";
import { api } from "@/lib/api";
import { FileText, Download, Loader2, AlertCircle, Clock } from "lucide-react";

export interface FileMeta {
  url: string;
  fileKey: string;
  fileIv: string;
  mimeType: string;
  fileName: string;
}

interface MessageBubbleProps {
  author: "me" | "them";
  text: string;
  time: string;
  fileMeta?: FileMeta;
  isScheduled?: boolean;
}

function EncryptedFileViewer({ meta }: { meta: FileMeta }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (meta.fileKey === "") {
      setBlobUrl(meta.url);
      return;
    }

    const downloadAndDecrypt = async () => {
      try {
        // 1. Get a secure temporary GET ticket from our backend
        const key = meta.url.split('/').pop();
        const readRes = await api.get(`/api/upload/read-url/${key}`);
        
        // 2. Download from AWS using the ticket
        const res = await fetch(readRes.data.presignedUrl);
        if (!res.ok) throw new Error("AWS Download failed");
        
        const encryptedBuffer = await res.arrayBuffer();
        
        // 3. Decrypt in memory
        const fileKey = await importFileKey(meta.fileKey);
        const decryptedBlob = await decryptFile(encryptedBuffer, meta.fileIv, fileKey);
        
        setBlobUrl(URL.createObjectURL(decryptedBlob));
      } catch (err) {
        console.error("Failed to decrypt file:", err);
        setError(true);
      }
    };
    downloadAndDecrypt();
  }, [meta]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg mt-1">
        <AlertCircle className="w-5 h-5" />
        Failed to decrypt file
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="flex items-center gap-2 text-sm opacity-70 p-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Decrypting attachment...
      </div>
    );
  }

  if (meta.mimeType.startsWith('image/')) {
    return (
      <div className="relative group mt-1 overflow-hidden rounded-lg">
        <img src={blobUrl} alt={meta.fileName} className="max-w-[280px] object-cover" />
        <a href={blobUrl} download={meta.fileName} className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
          <Download className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <a href={blobUrl} download={meta.fileName} className="flex items-center gap-3 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 p-3 rounded-lg transition-colors mt-1 max-w-[280px]">
      <div className="bg-background/50 p-2 rounded-md">
        <FileText className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{meta.fileName}</p>
        <p className="text-[11px] opacity-70">Click to download</p>
      </div>
      <Download className="w-5 h-5 opacity-70" />
    </a>
  );
}

export default function MessageBubble({ author, text, time, fileMeta, isScheduled }: MessageBubbleProps) {
  const mine = author === "me";
  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[75%] flex-col gap-1", mine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft transition-all",
            mine
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border bg-card text-card-foreground",
            isScheduled && "opacity-70 border-dashed border-2 border-primary/50 bg-background text-foreground"
          )}
        >
          {text && !text.startsWith("[File") && (
            <p className="text-[15px] leading-relaxed">{text}</p>
          )}
          {fileMeta && <EncryptedFileViewer meta={fileMeta} />}
        </div>
        <span className="px-1 text-[11px] text-muted-foreground flex items-center gap-1">
          {isScheduled && <Clock className="w-3 h-3" />}
          {isScheduled ? `Scheduled for ${time}` : time}
        </span>
      </div>
    </div>
  );
}
