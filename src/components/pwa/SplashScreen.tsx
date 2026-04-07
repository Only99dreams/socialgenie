import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onAnimationComplete={onFinish}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <Zap className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">SocialGenie</h1>
        <motion.div
          className="w-48 h-1 rounded-full bg-secondary overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}
            onAnimationComplete={onFinish}
          />
        </motion.div>
        <p className="text-sm text-muted-foreground">Your AI Social Media Manager</p>
      </motion.div>
    </motion.div>
  );
};
