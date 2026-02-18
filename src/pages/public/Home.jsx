import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: 'Users',
      title: 'Candidate Management',
      description: 'Comprehensive candidate tracking with skills, visa status, and placement history'
    },
    {
      icon: 'Target',
      title: 'Submission Tracking',
      description: 'Track all candidate submissions to vendors with real-time status updates'
    },
    {
      icon: 'Calendar',
      title: 'Interview Scheduling',
      description: 'Automated interview scheduling with mentor assignment and reminders'
    },
    {
      icon: 'Briefcase',
      title: 'Placement Management',
      description: 'End-to-end placement lifecycle tracking with client and vendor details'
    },
    {
      icon: 'FileText',
      title: 'HR & Onboarding',
      description: 'Streamlined onboarding with visa tracking and document verification'
    },
    {
      icon: 'DollarSign',
      title: 'Invoicing & Payroll',
      description: 'Automated invoicing with timesheet management and payroll processing'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Zap" size={24} color="white" />
              </div>
              <span className="text-2xl font-bold text-foreground">CRM Staffing</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigate('/')} className="text-foreground hover:text-primary transition-colors">Home</button>
              <button onClick={() => navigate('/about')} className="text-muted-foreground hover:text-foreground transition-colors">About</button>
              <button onClick={() => navigate('/services')} className="text-muted-foreground hover:text-foreground transition-colors">Services</button>
              <button onClick={() => navigate('/industries')} className="text-muted-foreground hover:text-foreground transition-colors">Industries</button>
              <button onClick={() => navigate('/contact')} className="text-muted-foreground hover:text-foreground transition-colors">Contact</button>
              <Button onClick={() => navigate('/login')} variant="default">Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              Enterprise CRM for <span className="text-primary">IT Staffing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Streamline your recruitment workflow from candidate sourcing to placement and payroll with our comprehensive CRM platform
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" onClick={() => navigate('/login')} className="bg-gradient-to-r from-primary to-secondary">
                Get Started
                <Icon name="ArrowRight" size={20} className="ml-2" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/contact')}>
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">Complete Staffing Solution</h2>
            <p className="text-xl text-muted-foreground">Everything you need to manage your staffing business</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features?.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border hover:shadow-elevation-2 transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon name={feature?.icon} size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature?.title}</h3>
                <p className="text-muted-foreground">{feature?.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Transform Your Staffing Business?</h2>
            <p className="text-xl mb-8 opacity-90">Join hundreds of staffing agencies using our platform</p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
              Start Free Trial
              <Icon name="ArrowRight" size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 CRM Staffing. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;