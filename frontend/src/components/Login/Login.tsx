import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../firebase/AuthContext';
import { gsap } from 'gsap';
import './Login.css';

const Login: React.FC = () => {
  const { signInWithGoogle, signInWithPhone } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState<'google' | 'phone'>('google');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const loginCardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const methodsRef = useRef<HTMLDivElement>(null);

  // GSAP animations on mount
  useEffect(() => {
    const tl = gsap.timeline();
    
    // Initial state
    gsap.set([loginCardRef.current, headerRef.current, methodsRef.current], {
      opacity: 0,
      y: 50
    });
    
    // Animate in sequence
    tl.to(loginCardRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .to(headerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4")
    .to(methodsRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.3");

    // Floating animation for sparkles
    gsap.to('.floating-sparkle', {
      y: -10,
      rotation: 360,
      duration: 3,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 0.5
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Button press animation
      gsap.to('.google-btn', {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
      
      await signInWithGoogle();
      
      // Success animation
      gsap.to(loginCardRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });
      
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      
      // Error shake animation
      gsap.to(loginCardRef.current, {
        x: -10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: "power2.inOut"
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPhone(phoneNumber);
      setConfirmationResult(result);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult) return;
    
    try {
      setLoading(true);
      setError('');
      await confirmationResult.confirm(verificationCode);
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" ref={loginCardRef}>
        <div className="login-header" ref={headerRef}>
          <h1>Welcome to Salesly</h1>
          <div className="punchy-statement">
            Managing your leads just got easier.
          </div>
          <p>Sign in to access your sales dashboard</p>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="login-methods" ref={methodsRef}>
          <div className="method-selector">
            <button
              className={`method-btn ${loginMethod === 'google' ? 'active' : ''}`}
              onClick={() => setLoginMethod('google')}
            >
              <Mail size={16} />
              Google
            </button>
            <button
              className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
              onClick={() => setLoginMethod('phone')}
            >
              <Phone size={16} />
              Phone
            </button>
          </div>

          {loginMethod === 'google' && (
            <div className="google-signin">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn btn-primary google-btn"
              >
                {loading ? (
                  <Loader2 size={20} className="spinning" />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          )}

          {loginMethod === 'phone' && (
            <div className="phone-signin">
              {!confirmationResult ? (
                <div className="phone-input-section">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="phone-input"
                    />
                  </div>
                  <button
                    onClick={handlePhoneSignIn}
                    disabled={loading || !phoneNumber}
                    className="btn btn-primary"
                  >
                    {loading ? <Loader2 size={16} className="spinning" /> : 'Send Code'}
                  </button>
                  <div id="recaptcha-container"></div>
                </div>
              ) : (
                <div className="verification-section">
                  <p>Enter the verification code sent to {phoneNumber}</p>
                  <div className="form-group">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      className="verification-input"
                    />
                  </div>
                  <button
                    onClick={handleVerifyCode}
                    disabled={loading || !verificationCode}
                    className="btn btn-primary"
                  >
                    {loading ? <Loader2 size={16} className="spinning" /> : 'Verify'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmationResult(null);
                      setVerificationCode('');
                    }}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;