import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Scholarship } from '@/types/scholarship';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  opportunities?: Scholarship[];
}

export const FloatingChatAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your ScholarStream AI assistant. I can help you find scholarships, hackathons, bounties, and more. What are you looking for?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickPrompts = [
    'Find urgent opportunities',
    'Scholarships for my major',
    'Hackathons this week',
    'High-value scholarships',
  ];

  const handleSend = async (message?: string) => {
    const messageText = message || input.trim();
    if (!messageText || !user) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Use the same API_BASE_URL as apiService for consistency
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://scholarstream-backend.onrender.com';
      
      console.log('🤖 Sending chat message to:', `${API_BASE_URL}/api/chat`);
      
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          message: messageText,
          context: {
            current_page: window.location.pathname,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Chat API error:', response.status, errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Chat response received:', data);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        opportunities: data.opportunities || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      
      // Provide helpful fallback response
      const fallbackMessage: Message = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Here are some things I can help you with:\n\n• Find urgent hackathons and bounties\n• Search scholarships by major or GPA\n• Discover competitions you can enter\n• Get application tips and strategies\n\nPlease try your question again, or refresh the page if the issue persists.",
      };
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast.error('Connection issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg hover:scale-110 transition-transform bg-gradient-to-r from-primary to-primary/80"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-yellow-400" />
      </Button>
    );
  }

  return (
    <Card className={`fixed ${
      isFullscreen 
        ? 'inset-4 w-auto h-auto max-w-full max-h-full' 
        : 'bottom-6 right-6 w-[400px] md:w-[450px] h-[600px] max-h-[80vh]'
    } flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-4 z-50 transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">ScholarStream AI</h3>
            <p className="text-xs text-muted-foreground">Your opportunity finder</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                
                {/* Opportunity Cards */}
                {message.opportunities && message.opportunities.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.opportunities.slice(0, 3).map((opp) => (
                      <Card key={opp.id} className="p-3 bg-background">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {opp.source_type}
                              </Badge>
                              {opp.priority_level === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm truncate">{opp.name}</h4>
                            <p className="text-xs text-muted-foreground">{opp.organization}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs font-semibold text-primary">
                                {opp.amount_display}
                              </span>
                              {opp.deadline && (
                                <span className="text-xs text-muted-foreground">
                                  Due: {new Date(opp.deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={() => window.location.href = `/opportunity/${opp.id}`}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => window.location.href = `/apply/${opp.id}`}
                          >
                            Apply
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleQuickPrompt(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask anything... (Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[44px] max-h-[200px] resize-none whitespace-pre-wrap break-words"
            disabled={isLoading}
            rows={2}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </Card>
  );
};