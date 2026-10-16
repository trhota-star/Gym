import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, delay = 0, as = 'div', ...rest }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.25 } } : undefined}
      className={`glass relative overflow-hidden p-5 sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  );
}
