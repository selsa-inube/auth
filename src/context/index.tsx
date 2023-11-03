import { createContext } from "react";
import { IAuthConfig } from "src/types/auth";

const AuthContext = createContext<IAuthConfig>({} as IAuthConfig);

export { AuthContext };
