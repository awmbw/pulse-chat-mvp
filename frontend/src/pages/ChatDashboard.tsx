import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageBubble from "@/components/MessageBubble";
import MessageComposer from "@/components/MessageComposer";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { importPrivateKey, importPublicKey, deriveSharedSecret, encryptText, decryptText, generateFileKey, exportFileKey, encryptFile } from "@/lib/crypto";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface Conversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  publicKey?: string;
}

interface Message {
  id: string;
  author: "me" | "them";
  text: string;
  time: string;
  fileMeta?: any;
  isScheduled?: boolean;
}

export default function ChatDashboard() {
  const { user } = useAuth();
  const myId = (user as any)?._id; // Get our MongoDB ID from the Auth token
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedSecret, setSharedSecret] = useState<CryptoKey | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const isTranslatingRef = useRef(isTranslating);
  const targetLanguageRef = useRef(targetLanguage);
  
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  useEffect(() => { isTranslatingRef.current = isTranslating; }, [isTranslating]);
  useEffect(() => { targetLanguageRef.current = targetLanguage; }, [targetLanguage]);

  // 1. Fetch real users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/users');
        const formatted = res.data.map((u: any) => ({
          id: u._id,
          name: u.username,
          initials: u.username.slice(0, 2).toUpperCase(),
          lastMessage: "Start a conversation",
          time: "",
          online: true,
          publicKey: u.publicKey
        }));
        setConversations(formatted);
        if (formatted.length > 0) {
          setActiveId(formatted[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  // 2. Derive Shared Secret
  useEffect(() => {
    if (!activeId || !user?.email) return;
    const active = conversations.find(c => c.id === activeId);
    if (!active || !active.publicKey) return;

    const derive = async () => {
      try {
        const privKeyStr = localStorage.getItem(`PRIVATE_KEY_${user.email}`);
        if (!privKeyStr) return;
        const privKey = await importPrivateKey(privKeyStr);
        const pubKey = await importPublicKey(active.publicKey!);
        const secret = await deriveSharedSecret(privKey, pubKey);
        setSharedSecret(secret);
      } catch (err) {
        console.error("Failed to derive shared secret", err);
      }
    };
    derive();
  }, [activeId, conversations, user?.email]);

  // 3. Fetch Message History & Join 1-on-1 Room
  useEffect(() => {
    if (!activeId || !myId || !sharedSecret) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get(`/api/messages/${activeId}`);
        const formatted = await Promise.all(res.data.map(async (m: any) => {
          let decryptedText = "Decryption failed";
          try {
            decryptedText = await decryptText(m.encryptedContent, m.iv, sharedSecret);
          } catch(e) {}
          let fileMeta = undefined;
          let messageText = decryptedText;
          if (decryptedText.startsWith("FILE::")) {
            try {
              fileMeta = JSON.parse(decryptedText.replace("FILE::", ""));
              messageText = `[File: ${fileMeta.fileName}]`;
            } catch(e) {}
          }
          return {
            id: m._id,
            author: m.sender === myId ? "me" : "them",
            text: messageText,
            fileMeta,
            time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            isScheduled: m.isScheduled
          };
        }));
        setMessages(formatted as Message[]);
      } catch (err) {
        console.error("Failed to fetch messages");
      }
    };
    fetchHistory();

    const room = [myId, activeId].sort().join('_');
    socket.emit("join_room", { room });

    const handleReceive = async (data: any) => {
      if (data.senderId !== myId) {
        try {
          const decryptedText = await decryptText(data.text, data.iv, sharedSecret);
          let fileMeta = undefined;
          let messageText = decryptedText;
          if (decryptedText.startsWith("FILE::")) {
            try {
              fileMeta = JSON.parse(decryptedText.replace("FILE::", ""));
              messageText = `[File: ${fileMeta.fileName}]`;
            } catch(e) {}
          } else if (isTranslatingRef.current) {
             try {
               const res = await api.post('/api/ai/translate', { text: messageText, targetLanguage: targetLanguageRef.current });
               messageText = res.data.translatedText;
             } catch (e) { console.error("Translation failed", e); }
          }
          setMessages((prev) => [
            ...prev,
            { id: Math.random().toString(), author: "them", text: messageText, fileMeta, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
          ]);
        } catch (e) {
          console.error("Live decryption failed", e);
        }
      }
    };

    socket.on("receive_message", handleReceive);
    return () => { socket.off("receive_message", handleReceive); };
  }, [activeId, myId, sharedSecret]);

  // 4. Send Message
  const handleSendMessage = async (text: string, lang: string, scheduledFor?: Date) => {
    if (!activeId || !myId || !sharedSecret) return;
    const room = [myId, activeId].sort().join('_');

    let finalMessage = text;
    try {
      if (isTranslating) {
        const res = await api.post('/api/ai/translate', { text, targetLanguage });
        finalMessage = res.data.translatedText;
      }
    } catch(e) {
      console.error("Translation failed", e);
    }

    // Optimistically add to UI
    const tempId = Math.random().toString();
    setMessages((prev) => [
      ...prev,
      { 
        id: tempId, 
        author: "me", 
        text: finalMessage, 
        time: scheduledFor ? scheduledFor.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        isScheduled: !!scheduledFor
      }
    ]);

    try {
      const { cipherText, iv } = await encryptText(finalMessage, sharedSecret);

      if (scheduledFor) {
        try {
          await api.post('/api/messages/schedule', {
            receiverId: activeId,
            text: cipherText,
            iv: iv,
            scheduledFor: scheduledFor.toISOString()
          });
        } catch (err: any) {
          console.error("Failed to schedule:", err);
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
        return;
      }

      socket.emit("send_message", {
        room,
        text: cipherText,
        iv: iv,
        senderId: myId,
        receiverId: activeId
      });
    } catch (err) {
      console.error("Failed to encrypt message", err);
    }
  };

  // 5. Send File
  const handleSendFile = async (file: File) => {
    if (!activeId || !myId || !sharedSecret) return;
    const room = [myId, activeId].sort().join('_');

    try {
      // 1. Generate temp file key & Encrypt file
      const fileKey = await generateFileKey();
      const arrayBuffer = await file.arrayBuffer();
      const { encryptedBlob, iv: fileIv } = await encryptFile(arrayBuffer, fileKey);
      const exportedFileKey = await exportFileKey(fileKey);

      // 2. Get Presigned URL
      const res = await api.post('/api/upload/presigned-url', { fileType: file.type });
      const { presignedUrl, publicUrl } = res.data;

      // 3. Upload to S3 directly
      await fetch(presignedUrl, {
        method: 'PUT',
        body: encryptedBlob,
        headers: { 'Content-Type': file.type }
      });

      // 4. Construct JSON payload
      const payload = "FILE::" + JSON.stringify({
        url: publicUrl,
        fileKey: exportedFileKey,
        fileIv: fileIv,
        mimeType: file.type,
        fileName: file.name
      });

      // 5. Encrypt payload with Shared Secret
      const { cipherText, iv: textIv } = await encryptText(payload, sharedSecret);

      // Optimistically add to UI
      const previewUrl = URL.createObjectURL(file);
      setMessages((prev) => [
        ...prev,
        { id: Math.random().toString(), author: "me", text: `[File Sent: ${file.name}]`, fileMeta: { url: previewUrl, fileKey: "", fileIv: "", mimeType: file.type, fileName: file.name }, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
      ]);

      socket.emit("send_message", {
        room,
        text: cipherText,
        iv: textIv,
        senderId: myId,
        receiverId: activeId
      });
    } catch (err) {
      console.error("Failed to send file", err);
    }
  };

  const handleSummarize = async () => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    try {
      const activeUser = conversations.find(c => c.id === activeId);
      const last50 = messages.slice(-50);
      let transcript = last50.map(m => `${m.author === 'me' ? 'User' : activeUser?.name}: ${m.text}`).join('\n');
      if (transcript.trim() === '') transcript = "(No messages yet)";

      const res = await api.post('/api/ai/summarize', { transcript });
      setSummaryText(res.data.summary);
    } catch(err: any) {
      console.error("Summarize Error:", err);
      setSummaryText(`Failed to generate summary: ${err.response?.data?.message || err.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className={cn(
        "w-full h-full md:w-[300px] md:shrink-0 md:border-r md:border-sidebar-border transition-transform",
        activeId ? "hidden md:block" : "block"
      )}>
        <Sidebar
          conversations={conversations}
          activeId={activeId || ""}
          onSelect={setActiveId}
        />
      </div>

      <section className={cn(
        "flex min-w-0 flex-1 flex-col h-full bg-background absolute inset-0 z-10 md:static md:flex md:z-0",
        !activeId ? "hidden md:flex" : "flex"
      )}>
        {active ? (
          <>
            <ChatHeader
              name={active.name}
              initials={active.initials}
              online={active.online}
              onSummarize={handleSummarize}
              onBack={() => setActiveId(null)}
            />

            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-8">
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                <div className="mx-auto rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] md:text-xs text-muted-foreground">
                  End-to-end encrypted · Today
                </div>
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">No messages yet. Send one to {active.name}!</p>
                )}
                {messages.map((m) => (
                  <MessageBubble key={m.id} author={m.author} text={m.text} time={m.time} fileMeta={m.fileMeta} isScheduled={m.isScheduled} />
                ))}
              </div>
            </div>

            <MessageComposer 
              onSendMessage={handleSendMessage} 
              onSendFile={handleSendFile} 
              isTranslating={isTranslating}
              setIsTranslating={setIsTranslating}
              targetLanguage={targetLanguage}
              setTargetLanguage={setTargetLanguage}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground p-8 text-center">
            Select a conversation to start chatting.
          </div>
        )}
      </section>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Catch-Up
            </DialogTitle>
            <DialogDescription>
              AI-generated summary of your recent conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {summaryLoading ? "Analyzing conversation..." : summaryText}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
