import { ProviderType } from "dist";
import { IAuthParams } from "./types";

const validateProvider = (provider: ProviderType, authParams: IAuthParams) => {
  switch (provider) {
    case "identidadv1":
    case "identidadv2":
      if (
        !authParams.clientId ||
        !authParams.clientSecret ||
        !authParams.realm
      ) {
        throw new Error(
          "Missing required parameters for identidadv1 provider."
        );
      }
      break;

    case "iauth":
      if (!authParams.originatorId || !authParams.applicationName) {
        throw new Error("Missing required parameters for iauth provider");
      }
      break;
    default:
      throw new Error(
        `Provider ${provider} is not supported. Please use one of the following: identidadv1, identidadv2, iauth.`
      );
  }
};

const resetSignOutTimer = (
  signOutTimeoutRef: React.RefObject<NodeJS.Timeout | null>,
  signOutIntervalRef: React.RefObject<NodeJS.Timeout | null>,
  withSignOutTimeout: boolean,
  signOutTime: number | undefined,
  redirectUrlOnTimeout: string | undefined,
  remainingSignOutTime: number,
  signOutCritialPaths: string[] | undefined,
  setRemainingSignOutTime: React.Dispatch<React.SetStateAction<number>>,
  logout: (isTimeout: boolean) => void
) => {
  signOutTimeoutRef.current && clearTimeout(signOutTimeoutRef.current);
  signOutIntervalRef.current && clearInterval(signOutIntervalRef.current);

  if (withSignOutTimeout && signOutTime && redirectUrlOnTimeout) {
    signOutTimeoutRef.current = setTimeout(() => {
      if (
        signOutCritialPaths?.some((path) =>
          window.location.pathname.includes(path)
        )
      )
        return;

      if (!window.location.href.includes(redirectUrlOnTimeout)) {
        authRedirect(redirectUrlOnTimeout);
      }

      logout(true);
    }, signOutTime);

    signOutIntervalRef.current = setInterval(() => {
      const newRemaining = remainingSignOutTime - 1000;
      setRemainingSignOutTime(newRemaining);

      if (newRemaining <= 0 && signOutIntervalRef.current) {
        signOutIntervalRef && clearInterval(signOutIntervalRef.current);
      }
    }, 1000);
  }
};

const setupSignOutEvents = (
  withSignOutTimeout: boolean,
  signOutTime: number | undefined,
  signOutTimeoutRef: React.RefObject<NodeJS.Timeout | null>,
  signOutIntervalRef: React.RefObject<NodeJS.Timeout | null>,
  redirectUrlOnTimeout: string | undefined,
  remainingSignOutTime: number,
  resetSignOutMouseMove: boolean,
  resetSignOutKeyDown: boolean,
  resetSignOutMouseDown: boolean,
  resetSignOutScroll: boolean,
  resetSignOutTouchStart: boolean,
  resetSignOutChangePage: boolean,
  signOutCritialPaths: string[] | undefined,
  setRemainingSignOutTime: React.Dispatch<React.SetStateAction<number>>,
  logout: (isTimeout: boolean) => void
) => {
  const resetTimer = () =>
    resetSignOutTimer(
      signOutTimeoutRef,
      signOutIntervalRef,
      withSignOutTimeout,
      signOutTime,
      redirectUrlOnTimeout,
      remainingSignOutTime,
      signOutCritialPaths,
      setRemainingSignOutTime,
      logout
    );

  const eventsConfig = [
    { event: "mousemove", active: resetSignOutMouseMove },
    { event: "keydown", active: resetSignOutKeyDown },
    { event: "mousedown", active: resetSignOutMouseDown },
    { event: "scroll", active: resetSignOutScroll },
    { event: "touchstart", active: resetSignOutTouchStart },
    { event: "popstate", active: resetSignOutChangePage },
  ];

  let observer: MutationObserver;
  let restoreHistory: (() => void) | null = null;

  if (withSignOutTimeout && signOutTime) {
    eventsConfig.forEach(({ event, active }) => {
      if (active) {
        window.addEventListener(event, resetTimer, { passive: true });
      }
    });

    if (resetSignOutScroll) {
      observer = new MutationObserver(() => {
        document.querySelectorAll("*").forEach((el) => {
          if (
            el.scrollHeight > el.clientHeight ||
            el.scrollWidth > el.clientWidth
          ) {
            el.addEventListener("scroll", resetTimer, { passive: true });
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (resetSignOutChangePage) {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      const handleHistoryChange = () => resetTimer();

      history.pushState = function (...args) {
        originalPushState.apply(this, args);
        handleHistoryChange();
      };

      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        handleHistoryChange();
      };

      restoreHistory = () => {
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      };
    }
  }

  return () => {
    eventsConfig.forEach(({ event, active }) => {
      if (active) {
        window.removeEventListener(event, resetTimer);
      }
    });

    if (resetSignOutScroll) {
      observer?.disconnect();
      document.querySelectorAll("*").forEach((el) => {
        el.removeEventListener("scroll", resetTimer);
      });
    }

    if (restoreHistory) {
      restoreHistory();
    }
  };
};

const authRedirect = (url: string) => {
  if (window === undefined) return;

  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export {
  authRedirect,
  resetSignOutTimer,
  setupSignOutEvents,
  validateProvider,
};
