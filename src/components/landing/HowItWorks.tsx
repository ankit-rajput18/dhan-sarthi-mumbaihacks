import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Upload, 
  Brain, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Share Your Financial Data",
      description: "Connect your bank accounts or manually add your income, expenses, and financial goals. Your data is encrypted and secure with bank-level security.",
      features: ["Bank account linking", "Manual entry option", "100% secure & private"],
      color: "from-blue-500 to-cyan-500",
      delay: 0.2,
    },
    {
      number: "02",
      icon: Brain,
      title: "AI Learns Your Habits",
      description: "Our AI analyzes your spending patterns, income sources, and financial behavior to understand your unique situation and create a personalized profile.",
      features: ["Spending analysis", "Income tracking", "Habit recognition"],
      color: "from-purple-500 to-pink-500",
      delay: 0.4,
    },
    {
      number: "03",
      icon: TrendingUp,
      title: "Chat & Get Smart Advice",
      description: "Ask anything! 'I want to buy a bike' or 'Help me save ₹50,000'. Get instant personalized plans, savings strategies, and step-by-step guidance to achieve your goals.",
      features: ["24/7 AI chat support", "Goal-based planning", "Actionable advice"],
      color: "from-orange-500 to-red-500",
      delay: 0.6,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-gradient-to-b from-secondary via-background to-secondary relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.02, 0.03, 0.02],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary to-accent rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.02, 0.03, 0.02],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent to-primary rounded-full blur-[120px]"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card shadow-soft mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Simple Process</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            How{" "}
            <span className="text-primary font-extrabold">
              Dhan-Sarthi
            </span>{" "}
            Works
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started in minutes and let AI transform your financial journey
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="relative"
            >
              {/* Connecting Line (Desktop) */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.8, delay: step.delay + 0.3 }}
                  className="hidden md:block absolute top-16 lg:top-20 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-accent origin-left"
                >
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                  >
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </motion.div>
                </motion.div>
              )}

              <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group h-full">
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <CardContent className="p-5 sm:p-6 lg:p-8 relative">
                  {/* Step Number Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={isInView ? { scale: 1, rotate: 0 } : {}}
                    transition={{ duration: 0.6, delay: step.delay }}
                    className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-10"
                  >
                    <div className={`bg-gradient-to-br ${step.color} rounded-full px-4 py-2 sm:px-5 sm:py-3 shadow-xl border-4 border-background`}>
                      <span className="text-xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
                        {step.number}
                      </span>
                    </div>
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      delay: step.delay + 0.2 
                    }}
                    className="mb-4 sm:mb-6"
                  >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2">
                    {step.features.map((feature, idx) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: step.delay + 0.4 + idx * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <Card className="inline-block glass-card border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8 sm:p-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-12 h-12 text-primary" />
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to Take Control?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Join thousands of users who are already managing their finances smarter with AI
              </p>
              <Link to="/signup">
              <Button 
                size="lg" 
                className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
