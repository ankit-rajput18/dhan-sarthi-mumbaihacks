import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Zap, PiggyBank, Calendar } from "lucide-react";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-secondary to-background pt-16">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-primary/3 rounded-full blur-[100px] opacity-50"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/3 rounded-full blur-[100px] opacity-50"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground"
            >
              Your Smart AI{" "}
              <span className="text-primary font-extrabold">
                Financial Partner
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              Share your financial data, chat with AI about your goals like "I want to buy a bike", and get personalized savings plans, budget tips, and smart advice to achieve your dreams.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/signup">
              <Button
                size="lg"
                className="gradient-primary text-white shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105 group"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
              >
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto lg:mx-0"
            >
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">50K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">₹100Cr+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Money Managed</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">4.8★</div>
                <div className="text-xs sm:text-sm text-muted-foreground">User Rating</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-card">
              {/* Mini Dashboard Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6"
              >
                <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-card border border-border">
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2" />
                  <div className="text-xs sm:text-sm font-medium">Monthly Savings</div>
                  <div className="text-lg sm:text-2xl font-bold text-primary">₹12,450</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6"
              >
                <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-card border border-border">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2" />
                  <div className="text-xs sm:text-sm font-medium">Tax Saved</div>
                  <div className="text-lg sm:text-2xl font-bold text-primary">₹45,000</div>
                </div>
              </motion.div>

              {/* Center Content */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-soft">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2" />
                    <p className="text-xs text-muted-foreground">Income</p>
                    <p className="text-base sm:text-lg font-bold text-primary">₹42,000</p>
                  </div>
                  <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-soft">
                    <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2" />
                    <p className="text-xs text-muted-foreground">Savings</p>
                    <p className="text-base sm:text-lg font-bold text-primary">₹37,500</p>
                  </div>
                </div>
                <div className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-soft text-center">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-primary" />
                  <h3 className="text-base sm:text-lg font-bold mb-1">AI-Powered Insights</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Smart financial decisions made easy
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
