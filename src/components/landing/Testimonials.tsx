import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Software Engineer",
      company: "Tech Corp",
      avatar: "PS",
      rating: 5,
      text: "Dhan-Sarthi has completely transformed how I manage my finances. The AI insights are incredibly accurate and have helped me save over ₹50,000 in just 3 months!",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Rahul Verma",
      role: "Business Owner",
      company: "Verma Enterprises",
      avatar: "RV",
      rating: 5,
      text: "As a business owner, tracking expenses was always a headache. This app makes it effortless. The loan analyzer feature helped me restructure my debt and save thousands on interest.",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Anita Desai",
      role: "Marketing Manager",
      company: "Brand Solutions",
      avatar: "AD",
      rating: 5,
      text: "The tax tips feature is a game-changer! I discovered deductions I never knew existed. The AI mentor is like having a personal financial advisor available 24/7.",
      color: "from-orange-500 to-red-500",
    },
    {
      name: "Vikram Singh",
      role: "Freelance Designer",
      company: "Self-Employed",
      avatar: "VS",
      rating: 5,
      text: "Managing irregular income as a freelancer was tough. Dhan-Sarthi's smart planner helps me budget effectively and I've finally built an emergency fund!",
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Sneha Patel",
      role: "Doctor",
      company: "City Hospital",
      avatar: "SP",
      rating: 5,
      text: "With my busy schedule, I barely had time to track expenses. The automatic categorization and calendar view make it so easy. Highly recommend!",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-gradient-to-b from-background via-secondary to-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-primary/3 rounded-full blur-[100px] opacity-50"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-accent/3 rounded-full blur-[100px] opacity-50"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card shadow-soft mb-6"
          >
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium">Loved by Users</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            What Our{" "}
            <span className="text-primary font-extrabold">
              Users Say
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of satisfied users who transformed their financial lives
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Testimonial Card */}
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="glass-card border-2 border-primary/20 shadow-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8 lg:p-12 relative">
                {/* Quote Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : {}}
                  transition={{ duration: 0.6 }}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 opacity-10"
                >
                  <Quote className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-primary" />
                </motion.div>

                {/* Rating */}
                <div className="flex gap-1 mb-4 sm:mb-6">
                  {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" />
                    </motion.div>
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-base sm:text-lg lg:text-xl text-foreground mb-6 sm:mb-8 leading-relaxed relative z-10">
                  "{testimonials[activeIndex].text}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-2 border-primary shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className={`bg-gradient-to-br ${testimonials[activeIndex].color} text-white text-base sm:text-lg font-bold`}>
                      {testimonials[activeIndex].avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg">{testimonials[activeIndex].name}</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {testimonials[activeIndex].role}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {testimonials[activeIndex].company}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === activeIndex
                      ? "w-8 h-3 bg-primary"
                      : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Thumbnail Preview (Desktop) */}
          <div className="hidden lg:flex justify-center gap-4 mt-8">
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveIndex(index)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`transition-all duration-300 ${
                  index === activeIndex ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <Avatar className={`w-12 h-12 border-2 ${
                  index === activeIndex ? "border-primary shadow-lg" : "border-transparent"
                }`}>
                  <AvatarImage src="" />
                  <AvatarFallback className={`bg-gradient-to-br ${testimonial.color} text-white font-bold`}>
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto"
        >
          {[
            { value: "50K+", label: "Happy Users" },
            { value: "4.8/5", label: "Average Rating" },
            { value: "₹100Cr+", label: "Money Managed" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
            >
              <Card className="glass-card text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
