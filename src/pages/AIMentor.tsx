import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bot, 
  Send, 
  AlertTriangle,
  TrendingUp,
  PiggyBank,
  Calendar,
  Lightbulb,
  Target,
  ChevronUp,
  ChevronDown,
  X,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles
} from "lucide-react";

const AIMentor = () => {
  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .chat-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .chat-scrollbar::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 4px;
      }
      .chat-scrollbar::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
      }
      .chat-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: "ai",
      message: "Hi! I'm your AI Money Mentor. I can help you with expense tracking, savings goals, and financial planning. What would you like to know?",
      time: "10:30 AM"
    }
  ]);
  const [showInsights, setShowInsights] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  
  const quickActions = [
    { id: 1, text: "How can I save more money?", category: "savings" },
    { id: 2, text: "Show my spending trends", category: "analysis" },
    { id: 3, text: "Help with loan prepayment", category: "loans" },
    { id: 4, text: "Tax-saving suggestions", category: "tax" }
  ];

  const stats = [
    { label: "Savings Rate", value: "24%", icon: PiggyBank, color: "text-success" },
    { label: "Goal Progress", value: "40%", icon: Target, color: "text-primary" },
    { label: "Days to Goal", value: "180 days", icon: Calendar, color: "text-warning" }
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: chatHistory.length + 1,
        type: "user",
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory(prev => [...prev, newMessage]);
      setMessage("");
      setIsTyping(true);
      
      // Simulate AI response with typing indicator
      setTimeout(() => {
        const aiResponse = {
          id: chatHistory.length + 2,
          type: "ai",
          message: "Thanks for your question! Based on your spending patterns, I recommend focusing on reducing food expenses by 15% and setting up an automated savings transfer. This could help you save an additional ₹2,500 monthly.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleQuickAction = (actionText: string) => {
    setMessage(actionText);
    inputRef.current?.focus();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      

      {/* Toggle Button for Insights */}
      {!showInsights && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <Button
            variant="ghost"
            onClick={() => setShowInsights(true)}
            className="w-full justify-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronDown className="w-4 h-4" />
            Show Insights
          </Button>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full h-full">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Money Mentor</h1>
                <p className="text-sm text-gray-600">Your personal finance coach</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages - Scrollable Area */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4 space-y-6 chat-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
        >
          {chatHistory.map((chat) => (
            <div key={chat.id} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${chat.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={chat.type === 'ai' ? 'bg-primary text-white' : 'bg-gray-600 text-white'}>
                    {chat.type === 'ai' ? <Bot className="w-4 h-4" /> : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={`p-4 rounded-2xl ${
                  chat.type === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{chat.message}</p>
                  <p className={`text-xs mt-2 ${
                    chat.type === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {chat.time}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Actions - Fixed at Bottom */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="text-xs h-8 whitespace-nowrap flex-shrink-0"
                onClick={() => handleQuickAction(action.text)}
              >
                {action.text}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input - Fixed at Bottom */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about your finances..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 border-gray-300 focus:border-primary focus:ring-primary rounded-xl"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim()}
              className="px-6 rounded-xl bg-primary hover:bg-primary/90"
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