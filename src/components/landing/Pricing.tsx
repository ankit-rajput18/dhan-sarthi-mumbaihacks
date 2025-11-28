import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { 
  Check, 
  Zap, 
  Crown, 
  Rocket,
  ArrowRight,
  Sparkles
} from "lucide-react";

const Pricing = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      icon: Zap,
      description: "Perfect for individuals starting their financial journey",
      monthlyPrice: 0,
      annualPrice: 0,
      color: "from-blue-500 to-cyan-500",
      popular: false,
      features: [
        "Basic expense tracking",
        "Monthly budget planning",
        "Up to 2 bank accounts",
        "Email support",
        "Mobile app access",
        "Basic reports",
      ],
      cta: "Get Started Free",
    },
    {
      name: "Pro",
      icon: Crown,
      description: "For serious users who want advanced insights",
      monthlyPrice: 299,
      annualPrice: 2990,
      color: "from-purple-500 to-pink-500",
      popular: true,
      features: [
        "Everything in Starter",
        "AI-powered insights",
        "Unlimited bank accounts",
        "Loan analyzer",
        "Tax optimization tips",
        "Priority support",
        "Advanced analytics",
        "Custom categories",
        "Export data",
      ],
      cta: "Start Pro Trial",
    },
    {
      name: "Premium",
      icon: Rocket,
      description: "Ultimate package for financial mastery",
      monthlyPrice: 599,
      annualPrice: 5990,
      color: "from-orange-500 to-red-500",
      popular: false,
      features: [
        "Everything in Pro",
        "Dedicated AI mentor",
        "Investment tracking",
        "Portfolio analysis",
        "Family accounts (up to 5)",
        "24/7 priority support",
        "Custom reports",
        "API access",
        "White-label option",
        "Personal onboarding",
      ],
      cta: "Go Premium",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-gradient-to-b from-secondary via-background to-secondary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-[100px] opacity-50"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/3 rounded-full blur-[100px] opacity-50"
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
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Simple Pricing</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Choose Your{" "}
            <span className="text-primary font-extrabold">
              Perfect Plan
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Start free, upgrade when you're ready. All plans include a 14-day money-back guarantee.
          </p>

          {/* Annual Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-4"
          >
            <Label htmlFor="annual-toggle" className={!isAnnual ? "font-semibold" : ""}>
              Monthly
            </Label>
            <Switch
              id="annual-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="annual-toggle" className={isAnnual ? "font-semibold" : ""}>
              Annual
            </Label>
            <Badge className="gradient-primary text-white border-0">
              Save 17%
            </Badge>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              whileHover={{ y: -10 }}
              className="relative"
            >
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 z-10"
                >
                  <Badge className="gradient-primary text-white border-0 px-3 py-1 sm:px-4 text-xs sm:text-sm shadow-lg">
                    Most Popular
                  </Badge>
                </motion.div>
              )}

              <Card className={`h-full border-2 transition-all duration-300 ${
                plan.popular 
                  ? "border-primary shadow-2xl sm:scale-105" 
                  : "border-border hover:border-primary/50 hover:shadow-xl"
              }`}>
                <CardHeader className="text-center pb-6 sm:pb-8">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={isInView ? { scale: 1, rotate: 0 } : {}}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      delay: 0.3 + index * 0.1 
                    }}
                    className="mx-auto mb-3 sm:mb-4"
                  >
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                      <plan.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Plan Name */}
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-2">
                    <motion.div
                      key={isAnnual ? "annual" : "monthly"}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-baseline justify-center gap-1 sm:gap-2"
                    >
                      <span className="text-3xl sm:text-4xl font-bold text-primary">
                        ₹{isAnnual ? Math.floor(plan.annualPrice / 12) : plan.monthlyPrice}
                      </span>
                      <span className="text-sm sm:text-base text-muted-foreground">/month</span>
                    </motion.div>
                    {isAnnual && plan.annualPrice > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs sm:text-sm text-muted-foreground mt-1"
                      >
                        Billed ₹{plan.annualPrice} annually
                      </motion.p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-6 sm:pb-8">
                  {/* Features List */}
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((feature, idx) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.4 + index * 0.1 + idx * 0.05 }}
                        className="flex items-start gap-2 sm:gap-3"
                      >
                        <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0`}>
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link to="/signup" className="w-full">
                    <Button
                      className={`w-full group ${
                        plan.popular
                          ? "gradient-primary text-white shadow-lg hover:shadow-xl"
                          : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                      }`}
                      size="lg"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Need a custom plan for your organization?
          </p>
          <Link to="/contact">
            <Button variant="link" className="text-primary font-semibold">
              Contact Sales →
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
