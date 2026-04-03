import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionTimeout() {
  const { signOut, isAuthenticated } = useAuthStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        alert("Your session has expired due to inactivity. Please log in again.");
        await signOut();
      }, TIMEOUT_MS);
    };

    // Initial setup
    resetTimer();

    // Events to track user activity
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    
    // Throttled event handler to avoid excessive re-renders/calls
    let throttling = false;
    const handleActivity = () => {
      if (!throttling) {
        resetTimer();
        throttling = true;
        setTimeout(() => (throttling = false), 1000); // Throttle to 1 second
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, signOut]);
}
