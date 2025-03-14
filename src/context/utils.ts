import { useCallback, useEffect, useRef, useState } from "react";

type UseSignOutTimeoutProps = {
  withSignOutTimeout?: boolean;
  signOutTimeout?: number;
  redirectUrlOnTimeout?: string;
  resetSignOutMouseMove?: boolean;
  resetSignOutKeyDown?: boolean;
  resetSignOutMouseDown?: boolean;
  resetSignOutScroll?: boolean;
  resetSignOutTouchStart?: boolean;
  rootId?: string;
  onSessionExpired?: () => void;
};

const useSignOutTimeout = ({
  withSignOutTimeout,
  signOutTimeout,
  redirectUrlOnTimeout,
  resetSignOutMouseMove = false,
  resetSignOutKeyDown = false,
  resetSignOutMouseDown = false,
  resetSignOutScroll = false,
  resetSignOutTouchStart = false,
  rootId,
  onSessionExpired,
}: UseSignOutTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();
  const [remainingTime, setRemainingTime] = useState<number>();

  const resetLogoutTimer = useCallback(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    intervalRef.current && clearInterval(intervalRef.current);

    if (signOutTimeout && redirectUrlOnTimeout) {
      startTimeRef.current = Date.now();
      setRemainingTime(signOutTimeout);

      timeoutRef.current = setTimeout(() => {
        onSessionExpired?.();
        if (!window.location.href.includes(redirectUrlOnTimeout)) {
          window.location.href = redirectUrlOnTimeout;
        }
      }, signOutTimeout);

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - (startTimeRef.current || 0);
        const newRemaining = Math.max(signOutTimeout - elapsed, 0);
        setRemainingTime(newRemaining);

        if (newRemaining <= 0) {
          intervalRef.current && clearInterval(intervalRef.current);
        }
      }, 1000);
    }
  }, [signOutTimeout, redirectUrlOnTimeout, onSessionExpired]);

  useEffect(() => {
    if (withSignOutTimeout && signOutTimeout && signOutTimeout > 0) {
      resetLogoutTimer();

      const eventConfig = [
        { event: "mousemove" as const, flag: resetSignOutMouseMove },
        { event: "keydown" as const, flag: resetSignOutKeyDown },
        { event: "mousedown" as const, flag: resetSignOutMouseDown },
        { event: "scroll" as const, flag: resetSignOutScroll },
        { event: "touchstart" as const, flag: resetSignOutTouchStart },
      ];

      eventConfig.forEach(({ event, flag }) => {
        if (flag) {
          window.addEventListener(event, resetLogoutTimer);
        }
      });

      return () => {
        timeoutRef.current && clearTimeout(timeoutRef.current);
        intervalRef.current && clearInterval(intervalRef.current);

        eventConfig.forEach(({ event, flag }) => {
          if (flag) {
            window.removeEventListener(event, resetLogoutTimer);
          }
        });
      };
    }
  }, [
    withSignOutTimeout,
    signOutTimeout,
    resetSignOutMouseMove,
    resetSignOutKeyDown,
    resetSignOutMouseDown,
    resetSignOutScroll,
    resetSignOutTouchStart,
    resetLogoutTimer,
  ]);

  useEffect(() => {
    if (resetSignOutScroll && rootId) {
      const checkElement = () => {
        const element = document.getElementById(rootId);
        if (!element) {
          console.error(`Elemento no encontrado con id: ${rootId}`);
          return;
        }

        const handleScroll = () => resetLogoutTimer();
        element.addEventListener("scroll", handleScroll);
        return () => element.removeEventListener("scroll", handleScroll);
      };

      const interval = setInterval(checkElement, 500);
      return () => clearInterval(interval);
    }
  }, [resetSignOutScroll, resetLogoutTimer, rootId]);

  useEffect(() => {
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, []);

  return { remainingSignOutTime: remainingTime };
};

export { useSignOutTimeout };
