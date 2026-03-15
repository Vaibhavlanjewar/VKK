import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase/firebaseConfig';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // CLEANUP RECAPTCHA ON UNMOUNT
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const initRecaptcha = () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response) => {
            // reCAPTCHA solved - will proceed to submit
          },
          'expired-callback': () => {
            alert("Recaptcha expired. Please try again.");
            window.location.reload();
          }
        });
      }
    } catch (err) {
      console.error("Recaptcha Init Error:", err);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Logic for redirect happens in your App.js/Routes auth listener
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return alert("Please enter a valid mobile number.");
    
    setLoading(true);
    initRecaptcha();
    
    const formatPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmation(result);
    } catch (err) { 
      console.error("Phone Auth Error:", err);
      alert(err.message); 
      // Reset recaptcha on error so user can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return alert("Enter 6-digit OTP");
    setVerifying(true);
    try {
      await confirmation.confirm(otp);
      // Success - auth state observer will handle the rest
    } catch (err) { 
      alert("Invalid OTP. Please try again."); 
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="logo-section">
          <span className="logo">VAIBHAV</span>
          <p className="sub-text">Krishi Kendra Management</p>
        </div>

        <button 
          className="google-btn" 
          onClick={handleGoogle} 
          disabled={loading}
          style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" />
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="divider"><span>OR PHONE LOGIN</span></div>

        {!confirmation ? (
          <form onSubmit={handlePhoneSubmit}>
            <div className="form-group">
              <label>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#888' }}>+91</span>
                <input 
                  type="tel" 
                  placeholder="99999 99999" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                  style={{ paddingLeft: '45px' }}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn-add" disabled={loading} style={{ width: '100%' }}>
              {loading ? "Sending OTP..." : "Send Verification OTP"}
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
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
              />
            </div>
            <button onClick={verifyOtp} className="btn-add" disabled={verifying} style={{ width: '100%' }}>
              {verifying ? "Verifying..." : "Verify & Login"}
            </button>
            <button 
              className="btn-link" 
              onClick={() => { setConfirmation(null); setOtp(""); }}
              style={{ display: 'block', margin: '15px auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
            >
              Change Number
            </button>
          </div>
        )}
        {/* Recaptcha container must be visible in DOM but can be empty */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;
