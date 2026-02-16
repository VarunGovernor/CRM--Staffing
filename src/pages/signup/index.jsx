import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SignupHeader from './components/SignupHeader';
import SignupForm from './components/SignupForm';
import SecurityBadges from '../login/components/SecurityBadges';

const SignupPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Sign Up - San Synapse-CRM</title>
        <meta name="description" content="Create your San Synapse-CRM account to access staffing and recruitment tools." />
      </Helmet>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

        <div className="relative w-full max-w-md">
          <div className="bg-card border border-border rounded-xl shadow-elevation-2 p-8">
            <SignupHeader />
            <SignupForm />
            <SecurityBadges />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date()?.getFullYear()} San Synapse-CRM. All rights reserved.
            </p>
          </div>
        </div>

        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl" />
      </div>
    </>
  );
};

export default SignupPage;
