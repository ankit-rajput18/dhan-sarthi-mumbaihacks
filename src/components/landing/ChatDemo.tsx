import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Sparkles, TrendingUp, PiggyBank } from "lucide-react";

const ChatDemo = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleMessages, setVisibleMessages] = useState(0);

  const chatMessages = [
    {
      type: "user",
      message: "I want to buy a bike worth ₹80,000. Can you help me save for it?",
      avatar: "U",
    },
    {
      type: "ai",
      message: "Great goal! Based on your current income of ₹42,000/month and expenses of ₹29,500, you can save ₹12,500 monthly.",
      avatar: "AI",
      highlight: true,
    },
    
    {
      type: "user",
      message: "That sounds good! Can I do it faster?",
      avatar: "U",
    },
    {
      type: "ai",
      message: "Yes! If you can save ₹15,000/month by cutting entertainment expenses, you'll reach your goal in just 5-6 months. I'll track your progress and send reminders!",
      avatar: "AI",
      highlight: true,
    },
  ];

  useEffect(() => {
    if (isInView && visibleMessages < chatMessages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isInView, visibleMessages, chatMessages.length]);

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-gradient-to-b from-secondary via-background to-secondary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-[100px] opacity-50"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card shadow-soft mb-6"
          >
            <MessageSquare className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">See It In Action</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Just{" "}
            <span className="text-primary font-extrabold">
              Ask & Achieve
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Have a financial goal? Simply chat with your AI mentor and get a personalized plan instantly
          </p>
        </motion.div>

        {/* Chat Interface Demo */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="glass-card border-2 border-primary/20 shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-primary to-accent p-4 sm:p-6 flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg">AI Money Mentor</h3>
                  <p className="text-white/80 text-xs sm:text-sm">Always here to help you achieve your goals</p>
                </div>
                <Badge className="ml-auto bg-green-500 text-white border-0">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  Online
                </Badge>
              </div>

              {/* Chat Messages */}
              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-secondary min-h-[400px] sm:min-h-[500px]">
                {chatMessages.slice(0, visibleMessages).map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`flex gap-3 sm:gap-4 ${msg.type === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <Avatar className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 ${
                      msg.type === "ai" ? "bg-gradient-to-br from-primary to-accent" : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    }`}>
                      <AvatarFallback className="text-white font-bold text-sm">
                        {msg.type === "ai" ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Bubble */}
                    <div className={`flex-1 ${msg.type === "user" ? "flex justify-end" : ""}`}>
                      <div
                        className={`inline-block max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 ${
                          msg.type === "user"
                            ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                            : msg.highlight
                            ? "bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30"
                            : "bg-card border border-border"
                        }`}
                      >
                        <p className={`text-sm sm:text-base leading-relaxed ${
                          msg.type === "user" ? "text-white" : "text-foreground"
                        }`}>
                          {msg.message}
                        </p>

                        {/* Plan Details */}
                        {msg.plan && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-card rounded-xl p-3 border border-border">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="w-4 h-4 text-primary" />
                                  <span className="text-xs text-muted-foreground">Timeline</span>
                                </div>
                                <p className="font-bold text-primary text-sm">{msg.plan.timeline}</p>
                              </div>
                              <div className="bg-card rounded-xl p-3 border border-border">
                                <div className="flex items-center gap-2 mb-1">
                                  <PiggyBank className="w-4 h-4 text-accent" />
                                  <span className="text-xs text-muted-foreground">Save Monthly</span>
                                </div>
                                <p className="font-bold text-accent text-sm">{msg.plan.monthlySaving}</p>
                              </div>
                            </div>

                            <div className="bg-card rounded-xl p-3 border border-border">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Wins:</p>
                              <ul className="space-y-2">
                                {msg.plan.tips.map((tip, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                                    <span className="text-primary mt-0.5">✓</span>
                                    <span className="text-muted-foreground">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {visibleMessages < chatMessages.length && visibleMessages > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 sm:gap-4"
                  >
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-accent">
                      <AvatarFallback className="text-white">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-card border border-border rounded-2xl p-4 flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-primary rounded-full"
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-center mt-8 sm:mt-12"
          >
            <p className="text-muted-foreground mb-2 text-sm sm:text-base">
              Your goals, your timeline, your personalized plan
            </p>
            <p className="text-primary font-semibold text-base sm:text-lg">
              Start chatting with your AI mentor today! 🚀
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ChatDemo;
