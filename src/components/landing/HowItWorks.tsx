import { motion } from "framer-motion";
import { Globe, Link2, Power, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Globe,
    step: "01",
    title: "Enter Your Website",
    description: "Provide your business website URL. Our AI will crawl and analyze your entire online presence to understand your brand.",
  },
  {
    icon: Link2,
    step: "02",
    title: "Connect Platforms",
    description: "Link your social media accounts via secure OAuth. We support Instagram, Facebook, X, LinkedIn, and TikTok.",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "AI Studies Your Business",
    description: "The AI analyzes your products, services, brand voice, target audience, and creates a comprehensive intelligence profile.",
  },
  {
    icon: Power,
    step: "04",
    title: "Activate & Relax",
    description: "Hit activate and watch your AI agent take over. It plans, creates, schedules, and publishes — learning and improving constantly.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-primary font-medium mb-2 block text-sm sm:text-base">How It Works</span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Set Up in <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
            From signup to autonomous posting in under 10 minutes. 
            No technical skills required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className={`relative flex items-start gap-6 mb-12 last:mb-0 ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent p-3 glow">
                  <step.icon className="w-full h-full text-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 ${index % 2 === 0 ? "md:text-left" : "md:text-right"}`}>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                  Step {step.step}
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
