import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';

// Components & Pages
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import AIAgent from './components/AIAgent'; // 1. Import the AI Agent

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        currentUser.getIdToken().then(token => {
          localStorage.setItem('token', token);
        });
      } else {
        localStorage.removeItem('token');
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Vaibhav Krishi Kendra...</p>
      </div>
    );
  }

  return (
    <Router>
      {/* Only show Navbar if user is logged in */}
      {user && <Navbar />}
      
      <div className="app-content">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" />} 
          />

          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/inventory" 
            element={user ? <Inventory /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/billing" 
            element={user ? <Billing /> : <Navigate to="/login" />} 
          />

          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>

      {/* 2. Place the AI Agent here: It stays floating on all protected pages */}
      {user && <AIAgent />}
    </Router>
  );
}

export default App;