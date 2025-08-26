import { getProvider } from "src/providers/factory";
import { refreshAccessToken } from "src/providers/identidad/authorization";

const utilValidateSession = async (
  provider: string,
  clientId: string,
  clientSecret: string | undefined,
  realm: string | undefined,
  authorizationParams: { redirectUri: string; scope: string[] },
  authStorage: Storage
) => {
  const selectedProvider = getProvider(provider);

  const sessionData = await selectedProvider.validateSession({
    clientId,
    clientSecret,
    realm,
    authorizationParams,
  });

  if (!sessionData) return;

  authStorage.setItem("user", JSON.stringify(sessionData.user));
  authStorage.setItem("accessToken", sessionData.accessToken);

  if (sessionData.refreshToken) {
    authStorage.setItem("refreshToken", sessionData.refreshToken);
    authStorage.setItem("expiresIn", sessionData.expiresIn.toString());
  }

  return sessionData;
};

const refreshTokens = async (
  setAccessToken: React.Dispatch<React.SetStateAction<string | undefined>>,
  realm: string | undefined,
  clientId: string,
  clientSecret: string | undefined,
  authStorage: Storage
) => {
  const savedAccessToken = authStorage.getItem("accessToken");
  const refreshToken = authStorage.getItem("refreshToken");

  savedAccessToken && setAccessToken(savedAccessToken);

  if (savedAccessToken && realm && clientSecret && refreshToken) {
    const refreshTokenResponse = await refreshAccessToken(
      savedAccessToken,
      realm,
      clientId,
      clientSecret,
      refreshToken
    );

    if (!refreshTokenResponse) return;

    setAccessToken(refreshTokenResponse.accessToken);

    authStorage.setItem("accessToken", refreshTokenResponse.accessToken);
    authStorage.setItem("refreshToken", refreshTokenResponse.refreshToken);
    authStorage.setItem("expiresIn", refreshTokenResponse.expiresIn);
  }
};

const resetSignOutTimer = (
  signOutTimeoutRef: React.RefObject<NodeJS.Timeout | null>,
  signOutIntervalRef: React.RefObject<NodeJS.Timeout | null>,
  withSignOutTimeout: boolean,
  signOutTime: number | undefined,
  redirectUrlOnTimeout: string | undefined,
  remainingSignOutTime: number,
  setRemainingSignOutTime: React.Dispatch<React.SetStateAction<number>>,
  logout: (isTimeout: boolean) => void
) => {
  signOutTimeoutRef.current && clearTimeout(signOutTimeoutRef.current);
  signOutIntervalRef.current && clearInterval(signOutIntervalRef.current);

  if (withSignOutTimeout && signOutTime && redirectUrlOnTimeout) {
    signOutTimeoutRef.current = setTimeout(() => {
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
      setRemainingSignOutTime,
      logout
    );

  const eventsConfig = [
    { event: "mousemove", active: resetSignOutMouseMove },
    { event: "keydown", active: resetSignOutKeyDown },
    { event: "mousedown", active: resetSignOutMouseDown },
    { event: "scroll", active: resetSignOutScroll },
    { event: "touchstart", active: resetSignOutTouchStart },
  ];

  let observer: MutationObserver;

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
  };
};

const authRedirect = (url: string) => {
  if (window === undefined) return;

  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export {
  authRedirect,
  refreshTokens,
  resetSignOutTimer,
  setupSignOutEvents,
  utilValidateSession,
};
