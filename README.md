# Inube Auth

This is a [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) component library for manage the authentication for @Inube.

## Features

This library use OAuth2 for authentication and authorization. It provides the following features:

- Login with redirect
- Logout
- Get access token
- Refresh access token
- Get user information
- Check if user is authenticated
- Check if user is loading
- Check if user is expired for sign out
- Save user information in local storage (dev) or session storage (prod)
- Sign out in timeout
  - Reset sign out time on mouse move
  - Reset sign out time on key down
  - Reset sign out time on mouse down
  - Reset sign out time on scroll
  - Reset sign out time on touch start
  - Reset sign out time on change page
  - Reset sign out time on critical paths

Actually, this library is only compatible with 'identidad' provider.

## Installation

Run the following command using **npm**:

```bash
npm install --save @inube/auth
```

## Configuration

### AuthProvider Props:

- clientId: Id of client
- clientSecret: Secret of client
- realm: Realm of client
- provider: Provider of client (e.g. "identidadv1", "identidadv2")
- authorizationParams: Authorization parameters
  - redirectUri: Redirect URI when authentication is successful
  - scope: Scope of authentication (e.g. [
    "openid",
    "email",
    "profile",
    "address",
    "phone",
    "identityDocument",
    ])
- isProduction: Is production environment, define for deciding which storage to use dev = localStorage, prod = sessionStorage
- withSignOutTimeout: With sign out in timeout
- signOutTime: Sign out time in milliseconds
- redirectUrlOnTimeout: Redirect URL on timeout
- resetSignOutMouseMove: Reset sign out on mouse move
- resetSignOutKeyDown: Reset sign out on key down
- resetSignOutMouseDown: Reset sign out on mouse down
- resetSignOutScroll: Reset sign out on scroll
- resetSignOutTouchStart: Reset sign out on touch start
- resetSignOutChangePage: Reset sign out on change page
- signOutCritialPaths: This routes will reset the sign out timer

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
      isProduction={IS_PRODUCTION}
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
