import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, Loader2, Plus, Paperclip, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
          B
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <ReactMarkdown className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function BaciChatPanel({ open, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversations on open
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const convs = await base44.agents.listConversations({ agent_name: "baci" });
      setConversations(convs || []);
      if (convs?.length > 0) {
        await selectConversation(convs[0].id);
      }
      setLoading(false);
    };
    load();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [open]);

  const selectConversation = async (convId) => {
    if (unsubRef.current) unsubRef.current();
    const conv = await base44.agents.getConversation(convId);
    setActiveConv(conv);
    setMessages(conv.messages || []);
    unsubRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      setMessages(data.messages || []);
    });
  };

  const startNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "baci",
      metadata: { name: `Chat ${new Date().toLocaleDateString("nl-BE")}` },
    });
    setConversations((prev) => [conv, ...prev]);
    await selectConversation(conv.id);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments((prev) => [...prev, { name: file.name, url: file_url }]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || sending) return;
    const text = input.trim();
    const fileUrls = attachments.map((a) => a.url);
    setInput("");
    setAttachments([]);
    setSending(true);

    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "baci",
        metadata: { name: text.slice(0, 40) },
      });
      setActiveConv(conv);
      setConversations((prev) => [conv, ...prev]);
      unsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });
    }

    const msg = { role: "user", content: text || "(bijlage)" };
    if (fileUrls.length > 0) msg.file_urls = fileUrls;
    await base44.agents.addMessage(conv, msg);
    setSending(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed bottom-0 right-6 w-[400px] h-[600px] bg-background border rounded-t-2xl shadow-2xl z-[9998] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">B</div>
          <div>
            <p className="text-sm font-semibold">Baci</p>
            <p className="text-[10px] text-white/70">HR.iQ Assistent</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={startNewConversation}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mb-3">B</div>
            <p className="text-sm font-medium">Hallo! Ik ben Baci 👋</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Vraag me alles over HR.iQ — werknemers, klanten, prestaties, of laat me data aanpassen.
            </p>
          </div>
        ) : (
          messages.filter(m => m.content).map((m, i) => <MessageBubble key={i} message={m} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-3 py-2.5 space-y-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1 text-xs">
                <FileIcon className="w-3 h-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{a.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            onPaste={async (e) => {
              const items = Array.from(e.clipboardData?.items || []);
              const imageItems = items.filter((item) => item.type.startsWith("image/"));
              if (imageItems.length === 0) return;
              e.preventDefault();
              setUploading(true);
              for (const item of imageItems) {
                const file = item.getAsFile();
                if (!file) continue;
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setAttachments((prev) => [...prev, { name: file.name || "afbeelding.png", url: file_url }]);
              }
              setUploading(false);
            }}
            placeholder="Stel een vraag..."
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            onClick={sendMessage}
            disabled={sending || (!input.trim() && attachments.length === 0)}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}