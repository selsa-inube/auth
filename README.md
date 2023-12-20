# Inube Auth

This is a [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) component library for manage the authentication for @Inube.

## Installation

Run the following command using **npm**:

```bash
npm install --save @inube/auth
```

## Configuration

### AuthProvider Props:

- provider: The authentication provider (e.g., "identidad").
- clientId: The client ID for authentication.
- clientSecret: The client secret for authentication.
- realm: The authentication realm.
- authorizationParams: Additional parameters for authentication.

Note: Save this values in env variables

## Usage

```tsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, useAuth } from "@inube/auth";

const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_AUTH_CLIENT_SECRET;
const REALM = import.meta.env.VITE_AUTH_REALM;
const PROVIDER = import.meta.env.VITE_AUTH_PROVIDER;
const AUTH_REDIRECT_URI = import.meta.env.VITE_AUTH_REDIRECT_URI;
const IS_PRODUCTION = import.meta.env.PROD;
const REDIRECT_URI = IS_PRODUCTION ? window.location.origin : AUTH_REDIRECT_URI;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider
      provider={PROVIDER}
      clientId={CLIENT_ID}
      clientSecret={CLIENT_SECRET}
      realm={REALM}
      authorizationParams={{ redirectUri: REDIRECT_URI, scope: [] }}
    >
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// App component
function App() {
  const { user, loginWithRedirect, isAuthenticated, isLoading, logout } =
    useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <p>Successfully logged in: {JSON.stringify(user)}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Development

- The components are developed using Typescript
- The code is commited using Conventional Commits and releases are managed using [auto](https://intuit.github.io/auto/) by intuit.

## Issues

If you got any issues while using the library, please report them as issues [here](https://github.com/selsa-inube/auth/issues)
