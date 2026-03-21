import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Bot, Send, Paperclip, X, Loader2 } from "lucide-react";
import MessageBubble from "@/components/prestaties/MessageBubble";

export default function PrestatieImport() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      const lastMsg = data.messages?.[data.messages.length - 1];
      if (lastMsg?.role === "assistant") setIsLoading(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "prestatie_import",
      metadata: { name: "Prestatie Import" }
    });
    setConversation(conv);
    setMessages(conv.messages || []);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push({ name: file.name, url: file_url });
    }
    setUploadedFiles(prev => [...prev, ...uploaded]);
    setIsUploading(false);
    e.target.value = "";
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || !conversation || isLoading) return;
    setIsLoading(true);

    const msg = {
      role: "user",
      content: input || (uploadedFiles.length > 0 ? `Verwerk deze prestatie PDF('s) en importeer de prestaties in het systeem.` : ""),
      file_urls: uploadedFiles.map(f => f.url)
    };

    setInput("");
    setUploadedFiles([]);
    await base44.agents.addMessage(conversation, msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-2">
        <Bot className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold">Prestatie Import Agent</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-accent/5 border-accent/20">
          <CardContent className="pt-4 pb-2 px-4">
            <p className="text-sm text-muted-foreground">
              Upload een prestatie PDF van een eindklant en de agent importeert automatisch de uren in het systeem.
              Ondersteunde formaten: <strong>Nextmemis/Centrale</strong> (maandoverzicht) en <strong>GPS/Hofkip</strong> (weekoverzicht).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-2 px-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Hoe werkt het?</p>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="bg-accent text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <span>Upload de PDF van de eindklant</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="bg-accent text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <span>Agent analyseert en matcht werknemers</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="bg-accent text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <span>Prestaties worden automatisch ingevoerd</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent" />
            Gesprek met Import Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
              <FileText className="w-12 h-12 opacity-30" />
              <div>
                <p className="font-medium">Upload een PDF om te beginnen</p>
                <p className="text-sm">Klik op het paperclip-icoon om een prestatie PDF bij te voegen</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Agent verwerkt...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Attached files preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 border-t flex flex-wrap gap-2">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                <FileText className="w-3 h-3" />
                <span className="max-w-[150px] truncate">{f.name}</span>
                <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="px-4 py-3 border-t flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            multiple
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Typ een bericht of upload een PDF..."
            className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[40px] max-h-[120px]"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || !conversation}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}