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
  >
    <App />
  </AuthProvider>
);
