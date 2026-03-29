import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;
// const API_URL = "http://localhost:5144" // or hardcode "http://localhost:5144"

function Authentication({ children }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    // reset form state whenever auth state changes
    setUsername("");
    setPassword("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // returns: { token, role, name }
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });

      if (res.status !== 200 || !res.data?.token) {
        throw new Error("Wrong username or password");
      }

      login(res.data.token, res.data.role, res.data.name);
    } catch (err) {
      setError("Wrong username or password");
    }
  };

  if (!isAuthenticated) {
    return (
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-xl font-bold mb-4">Login Required</h2>

            <input
              type="text"
              placeholder="Enter username"
              className="border rounded p-2 w-full mb-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <input
              type="password"
              placeholder="Enter password"
              className="border rounded p-2 w-full mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && (
              <p className="text-red-600 text-sm mb-2">{error}</p> // show inline error
            )}

            <button className="w-full !bg-green-700 text-white py-2 rounded hover:!bg-green-800">
              Login
            </button>
          </div>
        </div>
      </form>
    );
  }

  return children;
}

export default Authentication;
