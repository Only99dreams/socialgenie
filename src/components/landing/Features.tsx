import { motion } from "framer-motion";
import { 
  Brain, 
  Calendar, 
  Image, 
  LineChart, 
  MessageSquare, 
  Rocket, 
  Shield, 
  Zap 
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Business Intelligence",
    description: "AI crawls your website and learns everything about your business, products, and brand voice automatically.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: MessageSquare,
    title: "Smart Copywriting",
    description: "Generates platform-optimized captions, hashtags, and CTAs that match your brand's unique tone.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Image,
    title: "Visual Content Creation",
    description: "Creates stunning images, graphics, and promotional materials using your brand colors and style.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Calendar,
    title: "Strategic Scheduling",
    description: "Plans content calendars weeks in advance, posting at optimal times for maximum engagement.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Rocket,
    title: "Automatic Publishing",
    description: "Connects to all your platforms and publishes content automatically without any manual intervention.",
    color: "from-indigo-500 to-violet-500"
  },
  {
    icon: LineChart,
    title: "Performance Learning",
    description: "Tracks engagement metrics and continuously improves content strategy based on what works.",
    color: "from-amber-500 to-yellow-500"
  },
  {
    icon: Shield,
    title: "Review Mode",
    description: "Want control? Enable review mode to approve content before it goes live.",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: Zap,
    title: "Multi-Platform",
    description: "Supports Instagram, Facebook, X (Twitter), LinkedIn, and TikTok all from one dashboard.",
    color: "from-rose-500 to-pink-500"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-16 sm:py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-primary font-medium mb-2 block text-sm sm:text-base">Features</span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Everything an AI Employee <span className="gradient-text">Should Do</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
            SocialGenie combines multiple AI agents working together to manage your 
            entire social media presence autonomously.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-4 sm:p-6 rounded-2xl card-gradient border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-full h-full text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
