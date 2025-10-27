import React from "react";
import {Link} from "react-router-dom";
import "./AdminNavbar.css"
import {useAuth} from "@/components/AuthContext.jsx";
// import generatePDF from "@/components/PrintLabels.jsx"
import printOrders from "@/components/PrintLabels.jsx"

function AdminNavbar() {
    const { logout } = useAuth();

    return (
            <nav className="navbar">
                <div className="navbar-left">
                    <Link to="/">
                        <img src="/logo.jpg" alt="MasseyGowns" className="logo" />
                    </Link>
                    <ul className="navbar-menu">
                        <li>
                            <Link to="/admineditceremonies">
                                CEREMONIES
                            </Link>
                        </li>
                        <li>
                            <Link to="/admineditdegrees">
                                DEGREES
                            </Link>
                        </li>
                        <li>
                            <Link to="/adminqueries">
                                QUERIES
                            </Link>
                        </li>
                        <li>
                            <Link to="/BuyRegalia">
                                SHOW  BUY ORDERS
                            </Link>
                        </li>
                        <li>
                            <Link to="/HireRegalia">
                                SHOW HIRE ORDERS
                            </Link>
                        </li>
                        <li>
                            <a onClick={printOrders} style={{cursor: "pointer"}}>
                                PRINT LABELS
                            </a>
                        </li>
                        <li>
                            <i onClick={logout} className="fa fa-sign-out logout-icon" style={{ cursor: "pointer" }}></i>
                        </li>
                    </ul>
                </div>
            </nav>
    );
}

export default AdminNavbar;