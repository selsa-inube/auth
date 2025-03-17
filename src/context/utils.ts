type EventConfig = {
  resetSignOutMouseMove: boolean;
  resetSignOutKeyDown: boolean;
  resetSignOutMouseDown: boolean;
  resetSignOutScroll: boolean;
  resetSignOutTouchStart: boolean;
  callback: () => void;
};

const calculateRemainingTime = (
  startTime: number | undefined,
  timeout: number
): number => {
  if (!startTime) return timeout;
  const elapsed = Date.now() - startTime;
  return Math.max(timeout - elapsed, 0);
};

const setupEventListeners = ({
  resetSignOutMouseMove,
  resetSignOutKeyDown,
  resetSignOutMouseDown,
  resetSignOutScroll,
  resetSignOutTouchStart,
  callback,
}: EventConfig) => {
  const eventConfig = [
    { event: "mousemove" as const, flag: resetSignOutMouseMove },
    { event: "keydown" as const, flag: resetSignOutKeyDown },
    { event: "mousedown" as const, flag: resetSignOutMouseDown },
    { event: "scroll" as const, flag: resetSignOutScroll },
    { event: "touchstart" as const, flag: resetSignOutTouchStart },
  ];

  eventConfig.forEach(({ event, flag }) => {
    if (flag) {
      window.addEventListener(event, callback);
    }
  });

  return () => {
    eventConfig.forEach(({ event, flag }) => {
      if (flag) {
        window.removeEventListener(event, callback);
      }
    });
  };
};

const checkElementExistence = (rootId: string, callback: () => void) => {
  let scrollCleanUp: () => void;

  const interval = setInterval(() => {
    const element = document.getElementById(rootId);
    if (element) {
      const handleScroll = () => callback();
      element.addEventListener("scroll", handleScroll);
      scrollCleanUp = () => element.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    }
  }, 500);

  return () => {
    clearInterval(interval);
    scrollCleanUp?.();
  };
};

export { calculateRemainingTime, setupEventListeners, checkElementExistence };
