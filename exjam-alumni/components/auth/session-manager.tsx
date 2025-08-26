"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/store/consolidated-auth";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, LogOut } from "lucide-react";
import toast from "react-hot-toast";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // Show warning 5 minutes before timeout
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function SessionManager() {
  const { isAuthenticated, refreshSession, signOut } = useAuth();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout>();
  const sessionTimerRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Reset activity timer on user interaction
  const resetActivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    
    // Hide warning if shown
    if (showWarning) {
      setShowWarning(false);
    }

    // Set new warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft(WARNING_BEFORE);
    }, SESSION_TIMEOUT - WARNING_BEFORE);

    // Set new session timeout
    sessionTimerRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  };

  // Handle session timeout
  const handleSessionTimeout = async () => {
    setShowWarning(false);
    await signOut();
    toast.error("Your session has expired. Please sign in again.");
    router.push("/login");
  };

  // Continue session
  const handleContinueSession = async () => {
    setShowWarning(false);
    await refreshSession();
    resetActivityTimer();
    toast.success("Session extended successfully");
  };

  // Handle logout
  const handleLogout = async () => {
    setShowWarning(false);
    await signOut();
    router.push("/login");
  };

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    
    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // Only reset if more than 1 minute has passed since last activity
      if (timeSinceLastActivity > 60000) {
        resetActivityTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial setup
    resetActivityTimer();

    // Check session periodically
    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        handleSessionTimeout();
      } else if (timeSinceLastActivity > SESSION_TIMEOUT - WARNING_BEFORE && !showWarning) {
        setShowWarning(true);
        setTimeLeft(SESSION_TIMEOUT - timeSinceLastActivity);
      }
    }, CHECK_INTERVAL);

    return () => {
      // Clean up
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [isAuthenticated]);

  // Update countdown timer
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          handleSessionTimeout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  if (!isAuthenticated) return null;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-3">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Your session will expire in{" "}
                <span className="font-semibold text-orange-600">
                  {formatTime(timeLeft)}
                </span>
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <div className="mt-4 rounded-lg bg-orange-50 p-4">
          <p className="text-sm text-orange-800">
            For your security, we automatically sign you out after {SESSION_TIMEOUT / 60000} minutes
            of inactivity. Would you like to continue your session?
          </p>
        </div>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={handleLogout}
            className="sm:flex-1"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleContinueSession}
            className="sm:flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}