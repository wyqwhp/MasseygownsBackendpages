// AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token"),
  );

  // store role in state too (optional but useful)
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [name, setName] = useState(localStorage.getItem("name") || "");

  // login now accepts token + role + name
  const login = (token, roleFromApi, nameFromApi) => {
    localStorage.setItem("token", token);

    if (roleFromApi) localStorage.setItem("role", roleFromApi);
    else localStorage.removeItem("role");

    if (nameFromApi) localStorage.setItem("name", nameFromApi);
    else localStorage.removeItem("name");

    setRole(roleFromApi || "");
    setName(nameFromApi || "");

    setIsAuthenticated(true);
    navigate("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");

    setRole("");
    setName("");

    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, role, name }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
