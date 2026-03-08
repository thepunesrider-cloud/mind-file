import { useState, FormEvent } from "react";
import { Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: number;
  content: string;
  sender: "ai" | "user";
}

const SYSTEM_PROMPT = `You are Sortify's support assistant. You help users with questions about the Sortify AI File Manager app.

Key features of Sortify:
- AI-powered file management: auto-tagging, summaries, entity extraction
- 10+ search methods: keyword, natural language, semantic, date, entity search
- Smart reminders with expiry date detection
- WhatsApp integration for search and upload (paid plans)
- File sharing with expiry links
- AI document chat for Q&A
- Smart folders with auto-categorization

Pricing Plans (INR):
- Free (₹0/mo): 100MB, 25 uploads, AI features, web only, no WhatsApp
- Starter (₹299/mo): 1GB, unlimited uploads, WhatsApp alerts, email support
- Pro (₹799/mo): 50GB, full WhatsApp chatbot, 5 team members, API access, priority search
- Business (₹2,499/mo): 1TB, unlimited team, SSO, integrations, 4hr SLA
- Enterprise (custom): unlimited, on-premise, custom AI, 1hr SLA

Be helpful, concise, and friendly. If asked about features not yet available, let users know it's coming soon. Guide users to the pricing page for plan comparisons.`;

export function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hi! 👋 I'm Sortify's AI assistant. Ask me anything about our features, pricing, or how to use the app!",
      sender: "ai",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, content: userMessage, sender: "user" },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: userMessage });

      const { data, error } = await supabase.functions.invoke("support-chat", {
        body: { messages: conversationHistory },
      });

      const reply = error
        ? "Sorry, I'm having trouble connecting right now. Please try again in a moment!"
        : data?.reply || "I'm not sure about that. Could you rephrase your question?";

      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, content: reply, sender: "ai" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: "Something went wrong. Please try again!",
          sender: "ai",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ExpandableChat
      position="bottom-right"
      size="md"
      icon={<Sparkles className="h-6 w-6" />}
    >
      <ExpandableChatHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Sortify Support</h3>
            <p className="text-xs text-muted-foreground">Ask me anything</p>
          </div>
        </div>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList smooth>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "ai" ? "received" : "sent"}
              layout="ai"
            >
              {message.sender === "ai" && (
                <ChatBubbleAvatar fallback="AI" />
              )}
              <ChatBubbleMessage
                variant={message.sender === "ai" ? "received" : "sent"}
              >
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received" layout="ai">
              <ChatBubbleAvatar fallback="AI" />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about features, pricing..."
            className="min-h-10 h-10 text-sm rounded-lg bg-muted/50 border-0 focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 shrink-0 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}
