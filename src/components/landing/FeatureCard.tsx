import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: string;
  delay?: number;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient = "from-primary/10 to-accent/10",
  delay = 0,
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <div className="h-full glass-card rounded-2xl p-6 sm:p-8 shadow-light hover:shadow-light-hover transition-all duration-300 border border-border/50 bg-card/50 backdrop-blur-sm">
        <motion.div
          className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-light group-hover:shadow-light-hover group-hover:scale-110 transition-all duration-300`}
        >
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
        </motion.div>

        <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="text-muted-foreground leading-relaxed">{description}</p>

        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.3 }}
          className="h-1 bg-gradient-to-r from-primary to-accent rounded-full mt-6 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </motion.div>
  );
};

export default FeatureCard;
