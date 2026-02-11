import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";

function SettingsGearIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.72327 14.1842 2.39723 13.9228 2.2116C13.6615 2.02598 13.3143 2.02598 12.62 2.02598H11.5703C10.876 2.02598 10.5288 2.02598 10.2675 2.2116C10.0061 2.39723 9.89631 2.72327 9.67674 3.37536L9.34283 4.37274C9.18997 4.77133 8.91373 5.11043 8.55464 5.34042L8.21778 5.53479C7.79904 5.74994 7.31789 5.80994 6.85926 5.70418L5.63905 5.36048C4.92075 5.15664 4.5616 5.05472 4.24396 5.18388C3.92632 5.31305 3.7397 5.63696 3.36647 6.28479L2.87286 7.14139C2.52289 7.74864 2.34791 8.05227 2.36605 8.38032C2.3842 8.70837 2.5912 8.98968 3.00522 9.55229L3.86694 10.6236C4.07856 10.9491 4.2048 11.4112 4.2048 11.8861C4.2048 12.3609 4.07856 12.823 3.86694 13.1485L3.00522 14.2199C2.5912 14.7825 2.3842 15.0638 2.36605 15.3918C2.34791 15.7199 2.52289 16.0235 2.87286 16.6308L3.36647 17.4874C3.7397 18.1352 3.92632 18.4591 4.24396 18.5883C4.5616 18.7175 4.92075 18.6155 5.63905 18.4117L6.85926 18.068C7.31789 17.9622 7.79904 18.0222 8.21778 18.2374L8.55464 18.4318C8.91373 18.6617 9.18997 19.0009 9.34283 19.3994L9.67674 20.3968C9.89631 21.0489 10.0061 21.375 10.2675 21.5606C10.5288 21.7462 10.876 21.7462 11.5703 21.7462H12.62C13.3143 21.7462 13.6615 21.7462 13.9228 21.5606C14.1842 21.375 14.294 21.0489 14.5136 20.3968L14.8475 19.3994C15.0004 19.0009 15.2766 18.6617 15.6357 18.4318L15.9726 18.2374C16.3913 18.0222 16.8725 17.9622 17.3311 18.068L18.5513 18.4117C19.2696 18.6155 19.6288 18.7175 19.9464 18.5883C20.264 18.4591 20.4506 18.1352 20.8239 17.4874L21.3175 16.6308C21.6675 16.0235 21.8424 15.7199 21.8243 15.3918C21.8061 15.0638 21.5991 14.7825 21.1851 14.2199L20.3234 13.1485C20.1118 12.823 19.9855 12.3609 19.9855 11.8861C19.9855 11.4112 20.1118 10.9491 20.3234 10.6236L21.1851 9.55229C21.5991 8.98968 21.8061 8.70837 21.8243 8.38032C21.8424 8.05227 21.6675 7.74864 21.3175 7.14139Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M15.5195 11.886C15.5195 13.8286 13.9422 15.4059 11.9996 15.4059C10.057 15.4059 8.47974 13.8286 8.47974 11.886C8.47974 9.94342 10.057 8.36614 11.9996 8.36614C13.9422 8.36614 15.5195 9.94342 15.5195 11.886Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

interface HeaderProps {
  onOpenSettings: () => void;
  totalTodos: number;
  completedTodos: number;
}

export function Header({
  onOpenSettings,
  totalTodos,
  completedTodos,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between pt-6 pb-2"
    >
      <AnimatePresence mode="wait">
        {totalTodos > 0 ? (
          <motion.span
            key={`${completedTodos}-${totalTodos}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-medium text-zinc-500 tracking-wide uppercase"
          >
            {completedTodos} of {totalTodos} done
          </motion.span>
        ) : (
          <span />
        )}
      </AnimatePresence>
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        onPress={onOpenSettings}
        aria-label="Settings"
        className="text-zinc-500 hover:text-zinc-300 rounded-xl"
        style={{ "--button-bg-hover": "#18181b", "--button-bg-pressed": "#18181b" } as React.CSSProperties}
      >
        <SettingsGearIcon size={18} className="text-current" />
      </Button>
    </motion.header>
  );
}
