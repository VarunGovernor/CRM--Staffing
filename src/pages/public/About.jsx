import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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
              <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">Home</button>
              <button onClick={() => navigate('/about')} className="text-foreground hover:text-primary transition-colors">About</button>
              <button onClick={() => navigate('/services')} className="text-muted-foreground hover:text-foreground transition-colors">Services</button>
              <button onClick={() => navigate('/industries')} className="text-muted-foreground hover:text-foreground transition-colors">Industries</button>
              <button onClick={() => navigate('/contact')} className="text-muted-foreground hover:text-foreground transition-colors">Contact</button>
              <Button onClick={() => navigate('/login')} variant="default">Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-foreground mb-6">About CRM Staffing</h1>
            <p className="text-xl text-muted-foreground mb-12">
              We are a leading provider of enterprise CRM solutions for IT staffing and recruitment companies across the United States.
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-4">Our Mission</h2>
                <p className="text-lg text-muted-foreground">
                  To empower staffing agencies with cutting-edge technology that streamlines their entire recruitment lifecycle, from candidate sourcing to placement and payroll management.
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-4">Why Choose Us</h2>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={24} className="text-primary mr-3 mt-1" />
                    <span>Comprehensive workflow management from candidate to payroll</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={24} className="text-primary mr-3 mt-1" />
                    <span>Role-based access control for team collaboration</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={24} className="text-primary mr-3 mt-1" />
                    <span>Automated compliance and document management</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={24} className="text-primary mr-3 mt-1" />
                    <span>Real-time analytics and performance tracking</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-3xl font-semibold text-foreground mb-4">Our Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Innovation</h3>
                    <p className="text-muted-foreground">Continuously improving our platform with the latest technology</p>
                  </div>
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Reliability</h3>
                    <p className="text-muted-foreground">Enterprise-grade security and 99.9% uptime guarantee</p>
                  </div>
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Support</h3>
                    <p className="text-muted-foreground">24/7 customer support to help you succeed</p>
                  </div>
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Transparency</h3>
                    <p className="text-muted-foreground">Clear pricing and honest communication</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 CRM Staffing. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;