import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } =
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
      <p>Correctamente iniciado: {JSON.stringify(user)}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default App;
