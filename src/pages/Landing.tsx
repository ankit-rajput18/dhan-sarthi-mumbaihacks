import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import ChatDemo from "@/components/landing/ChatDemo";
import Testimonials from "@/components/landing/Testimonials";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <ChatDemo />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
};

export default Landing;
