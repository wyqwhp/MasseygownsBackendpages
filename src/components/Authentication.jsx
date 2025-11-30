import React, {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import {useAuth} from "@/components/AuthContext.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE;

function Authentication({ children }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();

    useEffect(() => {
        setUsername(null);
        setPassword(null);
        setError(null);
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/check-password`, {
                username,
                password,
            });
            if (res.status !== 200 || !res.data.valid) {
                throw Error("Wrong username or password");
            }
            login(res.data.token); // ✅ Update context and redirect
            // eslint-disable-next-line no-unused-vars
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
                            type="username"
                            placeholder="Enter username"
                            className="border rounded p-2 w-full mb-3"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Enter password"
                            className="border rounded p-2 w-full mb-3"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                            <p className="text-red-600 text-sm mb-2">{error}</p>  // show inline error
                        )}
                        <button
                            className="w-full !bg-green-700 text-white py-2 rounded hover:!bg-green-800">
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
