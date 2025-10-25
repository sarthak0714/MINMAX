import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface BackgroundAuraProps {
  color: string;
  keyId: string;
}

const BackgroundGrad: React.FC<BackgroundAuraProps> = ({ color, keyId }) => {
  // 🎨 Random offset per change for natural glow variation
  const { x, y } = useMemo(() => {
    const xOffset = 40 + Math.random() * 20; // 40–60%
    const yOffset = 50 + Math.random() * 15; // 50–65%
    return { x: xOffset, y: yOffset };
  }, [keyId]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={keyId}
        initial={{
          opacity: 0,
          background: `radial-gradient(circle at ${x}% ${y}%, ${color}90 0%, ${color}30 40%, transparent 80%)`,
        }}
        animate={{
          opacity: 0.9,
          background: `radial-gradient(circle at ${x}% ${y}%, ${color}90 0%, ${color}30 40%, transparent 80%)`,
        }}
        exit={{
          opacity: 0,
          background: `radial-gradient(circle at ${x}% ${y}%, ${color}90 0%, ${color}30 40%, transparent 80%)`,
        }}
        transition={{
          opacity: {
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1],
          },
          background: {
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1],
          },
        }}
        className="absolute top-[-55%] left-1/2 -translate-x-1/2 w-[220vw] h-[220vw] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${x}% ${y}%, ${color}90 0%, ${color}30 40%, transparent 80%)`,
          opacity: 0.9,
        }}
      />
    </AnimatePresence>
  );
};

export default BackgroundGrad;
