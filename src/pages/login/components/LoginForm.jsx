import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

// Steps:
//  'login'        → email + password (default)
//  'forgot-otp'   → enter OTP sent to email
//  'new-password' → set new password after OTP verified

const LoginForm = () => {
  const navigate = useNavigate();
  const { signIn, sendOtp, verifyOtp, setPassword: setNewPasswordApi } = useAuth();

  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPasswordInput] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const clearErrors = () => setErrors({});

  // ── Step 1: email + password login ───────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return setErrors({ email: 'Please enter a valid email address' });
    }
    if (!password) return setErrors({ password: 'Password is required' });
    setIsLoading(true);
    clearErrors();
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setErrors({ general: 'Invalid email or password. Please try again.' });
    } else {
      navigate('/dashboard');
    }
  };

  // ── Forgot password: send OTP ─────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return setErrors({ email: 'Enter your email address above first' });
    }
    setIsLoading(true);
    clearErrors();
    const { error } = await sendOtp(email);
    setIsLoading(false);
    if (error) {
      setErrors({ general: error.message || 'Failed to send OTP. Please try again.' });
    } else {
      setStep('forgot-otp');
      setSuccessMessage(`A 6-digit code was sent to ${email}`);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return setErrors({ otp: 'Enter the 6-digit code' });
    setIsLoading(true);
    clearErrors();
    const { error } = await verifyOtp(email, otp);
    setIsLoading(false);
    if (error) {
      setErrors({ otp: 'Invalid or expired code. Please try again.' });
    } else {
      setStep('new-password');
      setSuccessMessage('');
    }
  };

  // ── Step 3: set new password ──────────────────────────────────────────────
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return setErrors({ newPassword: 'Minimum 8 characters' });
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      return setErrors({ newPassword: 'Must contain uppercase, lowercase, and a number' });
    if (newPassword !== confirmNewPassword)
      return setErrors({ confirmNewPassword: 'Passwords do not match' });
    setIsLoading(true);
    clearErrors();
    const { error } = await setNewPasswordApi(newPassword);
    setIsLoading(false);
    if (error) {
      setErrors({ general: error.message || 'Failed to update password.' });
    } else {
      navigate('/dashboard');
    }
  };

  // ── Shared banners ────────────────────────────────────────────────────────
  const ErrorBanner = ({ message }) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <Icon name="AlertCircle" size={16} className="text-red-500" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );

  const SuccessBanner = ({ message }) => (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <Icon name="CheckCircle" size={16} className="text-green-500" />
        <p className="text-sm text-green-700">{message}</p>
      </div>
    </div>
  );

  // ── Login screen ──────────────────────────────────────────────────────────
  if (step === 'login') {
    return (
      <form onSubmit={handleLogin} className="space-y-6">
        {errors.general && <ErrorBanner message={errors.general} />}

        <Input
          label="Email Address"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
          error={errors.email}
          required
          disabled={isLoading}
          autoFocus
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPasswordInput(e.target.value); clearErrors(); }}
            error={errors.password}
            required
            disabled={isLoading}
          />
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isLoading}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Create account
          </Link>
        </p>
      </form>
    );
  }

  // ── Forgot password OTP ───────────────────────────────────────────────────
  if (step === 'forgot-otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        {successMessage && <SuccessBanner message={successMessage} />}
        {errors.general && <ErrorBanner message={errors.general} />}

        <Input
          label="6-Digit Code"
          type="text"
          placeholder="Enter the code from your email"
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearErrors(); }}
          error={errors.otp}
          required
          disabled={isLoading}
          autoFocus
          maxLength={6}
        />

        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="block w-full text-sm text-muted-foreground hover:text-primary"
          >
            Didn't receive it? Resend code
          </button>
          <button
            type="button"
            onClick={() => { setStep('login'); clearErrors(); setOtp(''); }}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to sign in
          </button>
        </div>
      </form>
    );
  }

  // ── Set new password ──────────────────────────────────────────────────────
  if (step === 'new-password') {
    return (
      <form onSubmit={handleSetNewPassword} className="space-y-6">
        <p className="text-sm text-center text-muted-foreground">OTP verified. Set your new password.</p>
        {errors.general && <ErrorBanner message={errors.general} />}

        <Input
          label="New Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); clearErrors(); }}
          error={errors.newPassword}
          required
          disabled={isLoading}
          autoFocus
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Repeat your new password"
          value={confirmNewPassword}
          onChange={(e) => { setConfirmNewPassword(e.target.value); clearErrors(); }}
          error={errors.confirmNewPassword}
          required
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          {isLoading ? 'Saving...' : 'Set Password & Sign In'}
        </Button>
      </form>
    );
  }

  return null;
};

export default LoginForm;
