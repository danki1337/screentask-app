import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Tabs } from "@heroui/react";
import type { User } from "firebase/auth";
import type { FocusTab } from "@/types";

function SettingsGearIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.72327 14.1842 2.39723 13.9228 2.2116C13.6615 2.02598 13.3143 2.02598 12.62 2.02598H11.5703C10.876 2.02598 10.5288 2.02598 10.2675 2.2116C10.0061 2.39723 9.89631 2.72327 9.67674 3.37536L9.34283 4.37274C9.18997 4.77133 8.91373 5.11043 8.55464 5.34042L8.21778 5.53479C7.79904 5.74994 7.31789 5.80994 6.85926 5.70418L5.63905 5.36048C4.92075 5.15664 4.5616 5.05472 4.24396 5.18388C3.92632 5.31305 3.7397 5.63696 3.36647 6.28479L2.87286 7.14139C2.52289 7.74864 2.34791 8.05227 2.36605 8.38032C2.3842 8.70837 2.5912 8.98968 3.00522 9.55229L3.86694 10.6236C4.07856 10.9491 4.2048 11.4112 4.2048 11.8861C4.2048 12.3609 4.07856 12.823 3.86694 13.1485L3.00522 14.2199C2.5912 14.7825 2.3842 15.0638 2.36605 15.3918C2.34791 15.7199 2.52289 16.0235 2.87286 16.6308L3.36647 17.4874C3.7397 18.1352 3.92632 18.4591 4.24396 18.5883C4.5616 18.7175 4.92075 18.6155 5.63905 18.4117L6.85926 18.068C7.31789 17.9622 7.79904 18.0222 8.21778 18.2374L8.55464 18.4318C8.91373 18.6617 9.18997 19.0009 9.34283 19.3994L9.67674 20.3968C9.89631 21.0489 10.0061 21.375 10.2675 21.5606C10.5288 21.7462 10.876 21.7462 11.5703 21.7462H12.62C13.3143 21.7462 13.6615 21.7462 13.9228 21.5606C14.1842 21.375 14.294 21.0489 14.5136 20.3968L14.8475 19.3994C15.0004 19.0009 15.2766 18.6617 15.6357 18.4318L15.9726 18.2374C16.3913 18.0222 16.8725 17.9622 17.3311 18.068L18.5513 18.4117C19.2696 18.6155 19.6288 18.7175 19.9464 18.5883C20.264 18.4591 20.4506 18.1352 20.8239 17.4874L21.3175 16.6308C21.6675 16.0235 21.8424 15.7199 21.8243 15.3918C21.8061 15.0638 21.5991 14.7825 21.1851 14.2199L20.3234 13.1485C20.1118 12.823 19.9855 12.3609 19.9855 11.8861C19.9855 11.4112 20.1118 10.9491 20.3234 10.6236L21.1851 9.55229C21.5991 8.98968 21.8061 8.70837 21.8243 8.38032C21.8424 8.05227 21.6675 7.74864 21.3175 7.14139Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M15.5195 11.886C15.5195 13.8286 13.9422 15.4059 11.9996 15.4059C10.057 15.4059 8.47974 13.8286 8.47974 11.886C8.47974 9.94342 10.057 8.36614 11.9996 8.36614C13.9422 8.36614 15.5195 9.94342 15.5195 11.886Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function LogoutIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 17.625C14.9264 19.4769 13.3831 21.0494 11.3156 20.9988C10.8346 20.987 10.2401 20.8194 9.05112 20.484C6.18961 19.6768 3.70555 18.3203 3.10956 15.2815C3 14.723 3 14.0944 3 12.8373V11.1627C3 9.90561 3 9.27705 3.10956 8.71846C3.70555 5.67965 6.18961 4.32316 9.05112 3.51603C10.2401 3.18064 10.8346 3.01295 11.3156 3.00119C13.3831 2.95061 14.9264 4.52307 15 6.37501" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M21 12H10M21 12C21 11.2998 19.0057 9.99153 18.5 9.5M21 12C21 12.7002 19.0057 14.0085 18.5 14.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function CrosshairIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  );
}

function ListIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 6H21M8 12H21M8 18H21" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ProfileDropdown({
  user,
  onOpenSettings,
  onSignOut,
}: {
  user: User;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-zinc-700 hover:ring-zinc-500 transition-all"
      >
        <img
          src={user.photoURL || ""}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[200px] bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden py-1.5"
          >
            <div className="px-2 py-1">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-800/70">
                <img
                  src={user.photoURL || ""}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-2 py-1">
              <button
                onClick={() => { onOpenSettings(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800/70 transition-colors"
              >
                <SettingsGearIcon size={16} className="text-zinc-500" />
                Settings
              </button>
              <button
                onClick={() => { onSignOut(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800/70 transition-colors"
              >
                <LogoutIcon size={16} className="text-zinc-500" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface HeaderProps {
  onOpenSettings: () => void;
  focusTab: FocusTab;
  onFocusTabChange: (tab: FocusTab) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  authLoading: boolean;
}

export function Header({
  onOpenSettings,
  focusTab,
  onFocusTabChange,
  user,
  onSignIn,
  onSignOut,
  authLoading,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between pt-6 pb-2"
    >
      <div className="w-9" />

      <Tabs
        selectedKey={focusTab}
        onSelectionChange={(key) => onFocusTabChange(key as FocusTab)}
        hideSeparator
        className="tabs--primary flex-none"
      >
        <Tabs.List aria-label="Focus mode">
          <Tabs.Tab id="now" key="now">
            <span className="inline-flex items-center gap-1.5">
              <CrosshairIcon size={12} className="text-current" />
              Now
            </span>
          </Tabs.Tab>
          <Tabs.Tab id="planning" key="planning">
            <span className="inline-flex items-center gap-1.5">
              <ListIcon size={12} className="text-current" />
              Planning
            </span>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <div className="flex items-center justify-end">
        {authLoading ? null : user ? (
          <ProfileDropdown
            user={user}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
          />
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onPress={onSignIn}
            className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-4"
          >
            Login
          </Button>
        )}
      </div>
    </motion.header>
  );
}
