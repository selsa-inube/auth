import { useContext } from "react";
import { AuthContext } from "src/context";

function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;
