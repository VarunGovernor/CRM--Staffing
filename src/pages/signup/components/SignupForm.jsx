import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

// Steps:
//  'details'  → enter name + role (email pre-filled from URL), then send OTP
//  'otp'      → verify 6-digit code
//  'password' → set password, create user_profile record

const SignupForm = ({ prefillEmail = '' }) => {
  const navigate = useNavigate();
  const { sendOtpNewUser, verifyOtp, setPassword } = useAuth();

  const [step, setStep] = useState('details');
  const [formData, setFormData] = useState({
    fullName: '',
    email: prefillEmail,
    role: 'recruiter',
  });
  const [otp, setOtp] = useState('');
  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const clearErrors = () => setErrors({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Step 1: collect details + send OTP ───────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Valid email is required';
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setIsLoading(true);
    clearErrors();
    const { error } = await sendOtpNewUser(formData.email);
    setIsLoading(false);

    if (error) {
      setErrors({ general: error.message || 'Failed to send code. Please try again.' });
    } else {
      setStep('otp');
      setSuccessMessage(`A 6-digit code was sent to ${formData.email}`);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return setErrors({ otp: 'Enter the 6-digit code' });
    setIsLoading(true);
    clearErrors();
    const { error } = await verifyOtp(formData.email, otp);
    setIsLoading(false);
    if (error) {
      setErrors({ otp: 'Invalid or expired code. Please try again.' });
    } else {
      setStep('password');
      setSuccessMessage('');
    }
  };

  // ── Step 3: set password + create profile ─────────────────────────────────
  const handleSetPassword = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (password.length < 8) newErrors.password = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      newErrors.password = 'Must contain uppercase, lowercase, and a number';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setIsLoading(true);
    clearErrors();

    const { error: pwError } = await setPassword(password);
    if (pwError) {
      setIsLoading(false);
      return setErrors({ general: pwError.message || 'Failed to set password.' });
    }

    // Create user_profile row — not approved yet, admin must approve
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').upsert({
        id: user.id,
        email: formData.email,
        full_name: formData.fullName,
        role: formData.role,       // tentative role until admin confirms
        requested_role: formData.role,
        is_active: true,
        is_approved: false,
      });
    }

    setIsLoading(false);
    navigate('/dashboard');
  };

  // ── Banners ───────────────────────────────────────────────────────────────
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

  // ── Step 1: details ───────────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <form onSubmit={handleSendOtp} className="space-y-5">
        {errors.general && <ErrorBanner message={errors.general} />}

        <Input
          label="Full Name"
          type="text"
          name="fullName"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          required
          disabled={isLoading}
          autoFocus
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
          disabled={isLoading || !!prefillEmail}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Role</label>
          <Select name="role" value={formData.role} onChange={handleChange} disabled={isLoading}>
            <option value="recruiter">Recruiter</option>
            <option value="sales">Sales</option>
            <option value="hr">HR</option>
            <option value="finance">Finance</option>
            <option value="employee">Employee</option>
          </Select>
          <p className="text-xs text-muted-foreground">Admin role requires approval</p>
        </div>

        <Button type="submit" variant="default" size="lg" fullWidth loading={isLoading} disabled={isLoading}
          className="bg-gradient-to-r from-primary to-secondary">
          {isLoading ? 'Sending Code...' : 'Send Verification Code'}
        </Button>

        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </form>
    );
  }

  // ── Step 2: OTP ───────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        {successMessage && <SuccessBanner message={successMessage} />}
        {errors.general && <ErrorBanner message={errors.general} />}

        <Input
          label="6-Digit Verification Code"
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

        <Button type="submit" variant="default" size="lg" fullWidth loading={isLoading} disabled={isLoading}
          className="bg-gradient-to-r from-primary to-secondary">
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="text-center space-y-2">
          <button type="button" onClick={handleSendOtp} disabled={isLoading}
            className="text-sm text-muted-foreground hover:text-primary block w-full">
            Didn't receive it? Resend code
          </button>
          <button type="button" onClick={() => { setStep('details'); clearErrors(); setOtp(''); }}
            className="text-sm text-muted-foreground hover:underline">
            ← Back
          </button>
        </div>
      </form>
    );
  }

  // ── Step 3: set password ──────────────────────────────────────────────────
  if (step === 'password') {
    return (
      <form onSubmit={handleSetPassword} className="space-y-5">
        <div className="text-center pb-1">
          <p className="text-sm text-muted-foreground">Email verified! Now set a password for future logins.</p>
        </div>
        {errors.general && <ErrorBanner message={errors.general} />}

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => { setPasswordState(e.target.value); clearErrors(); }}
          error={errors.password}
          required
          disabled={isLoading}
          autoFocus
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }}
          error={errors.confirmPassword}
          required
          disabled={isLoading}
        />

        <Button type="submit" variant="default" size="lg" fullWidth loading={isLoading} disabled={isLoading}
          className="bg-gradient-to-r from-primary to-secondary">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    );
  }

  return null;
};

export default SignupForm;
