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
  >
    <App />
  </AuthProvider>
);
