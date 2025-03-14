import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./context/index.tsx";

const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_AUTH_CLIENT_SECRET;
const REALM = import.meta.env.VITE_AUTH_REALM;
const PROVIDER = import.meta.env.VITE_AUTH_PROVIDER;
const AUTH_REDIRECT_URI = import.meta.env.VITE_AUTH_REDIRECT_URI;
const IS_PRODUCTION = import.meta.env.PROD;
const REDIRECT_URI = IS_PRODUCTION ? window.location.origin : AUTH_REDIRECT_URI;

const WITH_AUTO_SIGNOUT = import.meta.env.VITE_WITH_AUTO_SIGNOUT;
const TIMEOUT = import.meta.env.VITE_TIMEOUT;
const SIGNOUT_REDIRECT_URL = import.meta.env.VITE_SIGNOUT_REDIRECT_URL;
const WITH_SIGNOUT_MOUSE_MOVE = import.meta.env.VITE_WITH_SIGNOUT_MOUSE_MOVE;
const WITH_SIGNOUT_KEY_DOWN = import.meta.env.VITE_WITH_SIGNOUT_KEY_DOWN;
const WITH_SIGNOUT_MOUSE_DOWN = import.meta.env.VITE_WITH_SIGNOUT_MOUSE_DOWN;
const WITH_SIGNOUT_SCROLL = import.meta.env.VITE_WITH_SIGNOUT_SCROLL;
const WITH_SIGNOUT_TOUCHSTART = import.meta.env.VITE_WITH_SIGNOUT_TOUCHSTART;
const ROOT_ID = import.meta.env.VITE_ROOT_ID;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider
    provider={PROVIDER}
    clientId={CLIENT_ID}
    clientSecret={CLIENT_SECRET}
    realm={REALM}
    authorizationParams={{
      redirectUri: REDIRECT_URI,
      scope: [],
    }}
    withSignOutTimeout={WITH_AUTO_SIGNOUT}
    signOutTimeout={TIMEOUT}
    redirectUrlOnTimeout={SIGNOUT_REDIRECT_URL}
    resetSignOutMouseMove={WITH_SIGNOUT_MOUSE_MOVE}
    resetSignOutKeyDown={WITH_SIGNOUT_KEY_DOWN}
    resetSignOutMouseDown={WITH_SIGNOUT_MOUSE_DOWN}
    resetSignOutScroll={WITH_SIGNOUT_SCROLL}
    resetSignOutTouchStart={WITH_SIGNOUT_TOUCHSTART}
    rootId={ROOT_ID}
  >
    <App />
  </AuthProvider>
);
