import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  PiggyBank, 
  Calculator, 
  Calendar, 
  Bot,
  Shield,
  Users,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const LandingPage = () => {
  const problems = [
    {
      icon: TrendingUp,
      stat: "70%",
      text: "don't track their expenses properly"
    },
    {
      icon: Calculator,
      stat: "EMI",
      text: "pile-up leading to financial stress"
    },
    {
      icon: Shield,
      stat: "Tax",
      text: "savings opportunities missed annually"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Smart Planner",
      description: "Track expenses and set savings goals with AI insights"
    },
    {
      icon: Calculator,
      title: "Loan Analyzer",
      description: "Optimize EMIs and get prepayment recommendations"
    },
    {
      icon: Shield,
      title: "Tax Tips",
      description: "Personalized tax-saving suggestions for your income"
    },
    {
      icon: Calendar,
      title: "Expense Calendar",
      description: "Visual spending tracker with daily breakdowns"
    },
    {
      icon: Bot,
      title: "AI Mentor",
      description: "Get proactive nudges and smart money coaching"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mobile-container py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img 
                  src="/logo.jpg" 
                  alt="Dhan-Sarthi Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mobile-title text-gradient">Dhan-Sarthi</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-primary-light text-primary hover:bg-primary/5">
                <span className="hidden sm:inline">Login</span>
                <span className="sm:hidden">Sign In</span>
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="sm">
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Join</span>
              </Button>
            </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-12 sm:py-16 lg:py-24">
        <div className="mobile-container">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 mb-4 sm:mb-6">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="mobile-caption text-white font-medium">AI-Powered Financial Management</span>
              </div>
              <h1 className="mobile-heading font-bold text-white mb-4 sm:mb-6">
                Take Control of Your <span className="text-yellow-300">Financial Future</span>
              </h1>
              <p className="mobile-body text-white/90 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
                Dhan-Sarthi is your intelligent financial companion that helps you track expenses, 
                optimize loans, save on taxes, and achieve your money goals with AI-powered insights.
              </p>
              <div className="mobile-flex gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button variant="hero" size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="animate-scale-in">
              <img 
                src={heroImage} 
                alt="Financial Dashboard" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mobile-container">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="mobile-heading font-bold mb-4">The Financial Challenges We Solve</h2>
            <p className="mobile-body text-muted-foreground max-w-2xl mx-auto">
              Most people struggle with these common financial problems. We're here to help you overcome them.
            </p>
          </div>
          
          <div className="mobile-grid">
            {problems.map((problem, index) => (
              <Card key={index} className="shadow-card border-0 text-center p-6 sm:p-8">
                <CardContent className="p-0">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <problem.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="mobile-title font-bold text-primary mb-2">{problem.stat}</div>
                  <p className="mobile-body text-muted-foreground">{problem.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-surface/30">
        <div className="mobile-container">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="mobile-heading font-bold mb-4">Powerful Features for Smart Money Management</h2>
            <p className="mobile-body text-muted-foreground max-w-2xl mx-auto">
              Everything you need to take control of your finances in one intelligent platform.
            </p>
          </div>
          
          <div className="mobile-grid">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card border-0 p-6 sm:p-8 hover:shadow-float transition-all duration-300">
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="mobile-subtitle font-semibold mb-2">{feature.title}</h3>
                  <p className="mobile-caption text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 hero-gradient">
        <div className="mobile-container text-center">
          <h2 className="mobile-heading font-bold text-white mb-4">Ready to Transform Your Financial Life?</h2>
          <p className="mobile-body text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already saving more, spending smarter, and achieving their financial goals.
          </p>
          <div className="mobile-flex gap-3 sm:gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="lg" className="gap-2">
                Start Your Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50 py-8 sm:py-12">
        <div className="mobile-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <img 
                    src="/logo.jpg" 
                    alt="Dhan-Sarthi Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="mobile-subtitle font-bold text-gradient">Dhan-Sarthi</span>
              </div>
              <p className="mobile-caption text-muted-foreground">
                Your intelligent financial companion for smarter money management.
              </p>
            </div>
            
            <div>
              <h4 className="mobile-caption font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mobile-caption font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">About</a></li>
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mobile-caption font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Contact</a></li>
                <li><a href="#" className="mobile-caption text-muted-foreground hover:text-foreground">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="mobile-caption text-muted-foreground">
              © 2024 Dhan-Sarthi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;