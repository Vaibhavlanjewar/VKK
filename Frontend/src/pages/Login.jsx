import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase/firebaseConfig';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);

  const initRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) { alert(err.message); }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    initRecaptcha();
    
    // Auto-add +91 if not present
    const formatPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    try {
      const result = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier);
      setConfirmation(result);
    } catch (err) { 
      alert(err.message); 
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmation.confirm(otp);
    } catch (err) { alert("Invalid OTP. Please try again."); }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="logo-section">
          <span className="logo">VAIBHAV</span>
          <p className="sub-text">Krishi Kendra Management</p>
        </div>

        <button className="google-btn" onClick={handleGoogle}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" />
          Continue with Google
        </button>

        <div className="divider"><span>OR PHONE LOGIN</span></div>

        {!confirmation ? (
          <form onSubmit={handlePhoneSubmit}>
            <div className="form-group">
              <label>Mobile Number</label>
              <input 
                type="tel" 
                placeholder="99999 99999" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn-add" disabled={loading}>
              {loading ? "Sending..." : "Send Verification OTP"}
            </button>
          </form>
        ) : (
          <div className="otp-section animation-slide">
            <div className="form-group">
              <label>Enter 6-Digit OTP</label>
              <input 
                type="text" 
                placeholder="0 0 0 0 0 0" 
                value={otp} 
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)} 
              />
            </div>
            <button onClick={verifyOtp} className="btn-add">Verify & Login</button>
            <button className="btn-link" onClick={() => setConfirmation(null)}>Change Number</button>
          </div>
        )}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;