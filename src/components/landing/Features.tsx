import { motion } from "framer-motion";
import {
  BarChart3,
  Target,
  Calculator,
  Receipt,
  Calendar,
  MessageSquare,
} from "lucide-react";
import FeatureCard from "./FeatureCard";

const Features = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Expense Dashboard",
      description:
        "Get a comprehensive view of your income and expenses with smart alerts and visual insights. Track your spending patterns in real-time.",
      gradient: "from-primary/10 to-primary-light/10",
    },
    {
      icon: Target,
      title: "Smart Planner",
      description:
        "Set monthly budgets, define savings goals, and receive AI-powered recommendations to achieve your financial objectives faster.",
      gradient: "from-accent/10 to-primary/10",
    },
    {
      icon: Calculator,
      title: "Loan Analyzer",
      description:
        "Visualize EMI breakdowns, calculate debt-to-income ratios, and get personalized repayment strategies to become debt-free.",
      gradient: "from-primary-dark/10 to-accent/10",
    },
    {
      icon: Receipt,
      title: "Tax Tips",
      description:
        "Receive personalized tax-saving suggestions, track deduction deadlines, and maximize your returns with expert AI guidance.",
      gradient: "from-accent/10 to-primary-light/10",
    },
    {
      icon: Calendar,
      title: "Expense Calendar",
      description:
        "See your transactions laid out day-by-day in an intuitive calendar view. Never miss a payment or recurring expense.",
      gradient: "from-primary/10 to-primary-dark/10",
    },
    {
      icon: MessageSquare,
      title: "AI Mentor Chat",
      description:
        "Simply ask: 'I want to buy a bike' or 'Help me save for a house'. Get personalized savings plans, budget adjustments, and step-by-step guidance to achieve any financial goal.",
      gradient: "from-primary-light/10 to-accent/10",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-32 bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card shadow-soft mb-4 sm:mb-6"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium">Powerful Features</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
            Everything You Need to{" "}
            <span className="text-primary font-extrabold">
              Master Your Money
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Dhan-Sarthi combines cutting-edge AI technology with intuitive design
            to give you complete control over your financial future.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
