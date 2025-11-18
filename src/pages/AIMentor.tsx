import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, TrendingUp, PiggyBank, Target, X } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { aiAPI } from "@/lib/api";
import { toast } from "sonner";

const AIMentor = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Format message with markdown-like syntax
  const formatMessage = (text: string) => {
    // Split by ** for bold text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      // Check if this part is bold (wrapped in **)
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const user = getAuthUser();
  const userName = user?.name || "User";

  const quickActions = [
    { id: 1, text: "How can I save more money?", icon: PiggyBank },
    { id: 2, text: "Show my spending trends", icon: TrendingUp },
    { id: 3, text: "Help with my financial goals", icon: Target },
  ];

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const response = await aiAPI.getHistory(50);
        
        if (response.success && response.history && response.history.length > 0) {
          const transformedHistory = response.history.map((msg: any, index: number) => ({
            id: index + 1,
            type: msg.role === 'user' ? 'user' : 'ai',
            message: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: msg.timestamp // Store original timestamp for deletion
          }));
          setChatHistory(transformedHistory);
        } else {
          setChatHistory([{
            id: 1,
            type: "ai",
            message: `Hi ${userName}! 👋 I'm your AI Money Mentor. I can help you with expense tracking, savings goals, and financial planning. What would you like to know?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setChatHistory([{
          id: 1,
          type: "ai",
          message: `Hi ${userName}! 👋 I'm your AI Money Mentor. I can help you with expense tracking, savings goals, and financial planning. What would you like to know?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date().toISOString()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [userName]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    const now = new Date();
    const userMessageObj = {
      id: chatHistory.length + 1,
      type: "user",
      message: userMessage,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString()
    };

    setChatHistory(prev => [...prev, userMessageObj]);
    setMessage("");
    setIsTyping(true);

    try {
      const response = await aiAPI.chat(userMessage);

      if (response.success) {
        const aiMessageObj = {
          id: chatHistory.length + 2,
          type: "ai",
          message: response.reply,
          time: new Date(response.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: response.timestamp
        };
        setChatHistory(prev => [...prev, aiMessageObj]);
      } else {
        throw new Error('AI response failed');
      }
    } catch (error: any) {
      console.error('AI chat error:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessageObj = {
        id: chatHistory.length + 2,
        type: "ai",
        message: "I'm sorry, I'm having trouble connecting right now. Please make sure the backend server is running and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessageObj]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (actionText: string) => {
    setMessage(actionText);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = async (index: number) => {
    // Find the user message and its corresponding AI response
    const userMessage = chatHistory[index];
    
    if (userMessage.type !== 'user') return;

    try {
      // Delete from database
      await aiAPI.deleteMessage(userMessage.timestamp);

      // Remove from local state
      const newHistory = chatHistory.filter((_, i) => {
        // Remove the user message at index
        if (i === index) return false;
        // Remove the AI response right after (index + 1)
        if (i === index + 1 && chatHistory[i].type === 'ai') return false;
        return true;
      });

      setChatHistory(newHistory);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete message');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 relative">
        
        <div className="max-w-4xl mx-auto py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading chat history...</p>
              </div>
            </div>
          ) : (
            <>
            {/* Fixed Watermark inside scrollable area */}
        

              {chatHistory.map((chat, index) => (
                
                <div key={chat.id} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'} mb-4 sm:mb-6 group px-2 sm:px-4`}>
                  {chat.type === 'ai' && (
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                        <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[85%] ${chat.type === 'user' ? 'bg-primary text-white' : 'bg-white border'} rounded-2xl px-3 py-2 sm:px-5 sm:py-3 shadow-sm relative`}>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{formatMessage(chat.message)}</p>
                    <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 ${chat.type === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {chat.time}
                    </p>
                    {/* Delete button - only show for user messages */}
                    {chat.type === 'user' && (
                      <button
                        onClick={() => handleDeleteMessage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        title="Delete this message and AI response"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {chat.type === 'user' && (
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ml-2 sm:ml-3 flex-shrink-0">
                      <AvatarFallback className="bg-gray-600 text-white">
                        {userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start mb-4 sm:mb-6 px-2 sm:px-4">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border rounded-2xl px-3 py-2 sm:px-5 sm:py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Quick Actions - Hidden on mobile, visible on desktop */}
      <div className="hidden sm:block px-4 py-3 border-t bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="text-xs gap-2"
                onClick={() => handleQuickAction(action.text)}
              >
                <action.icon className="w-3 h-3" />
                {action.text}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about your finances..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || isTyping}
              className="px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentor;
