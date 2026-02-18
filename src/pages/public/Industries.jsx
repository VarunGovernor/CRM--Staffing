import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const Industries = () => {
  const navigate = useNavigate();

  const industries = [
    {
      icon: 'Code',
      title: 'Software Development',
      technologies: ['Java', 'Python', '.NET', 'JavaScript', 'React', 'Angular', 'Node.js']
    },
    {
      icon: 'Cloud',
      title: 'Cloud & DevOps',
      technologies: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform']
    },
    {
      icon: 'Database',
      title: 'Data & Analytics',
      technologies: ['SQL', 'NoSQL', 'Big Data', 'Hadoop', 'Spark', 'Tableau', 'Power BI']
    },
    {
      icon: 'Shield',
      title: 'Cybersecurity',
      technologies: ['Network Security', 'Penetration Testing', 'SIEM', 'Compliance', 'IAM']
    },
    {
      icon: 'Smartphone',
      title: 'Mobile Development',
      technologies: ['iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin']
    },
    {
      icon: 'Network',
      title: 'Infrastructure',
      technologies: ['Networking', 'System Administration', 'VMware', 'Linux', 'Windows Server']
    }
  ];

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
              <button onClick={() => navigate('/about')} className="text-muted-foreground hover:text-foreground transition-colors">About</button>
              <button onClick={() => navigate('/services')} className="text-muted-foreground hover:text-foreground transition-colors">Services</button>
              <button onClick={() => navigate('/industries')} className="text-foreground hover:text-primary transition-colors">Industries</button>
              <button onClick={() => navigate('/contact')} className="text-muted-foreground hover:text-foreground transition-colors">Contact</button>
              <Button onClick={() => navigate('/login')} variant="default">Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Industries & Technologies</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We specialize in placing top IT talent across diverse technology stacks and industries
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries?.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card p-8 rounded-xl border border-border hover:shadow-elevation-2 transition-all"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Icon name={industry?.icon} size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">{industry?.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {industry?.technologies?.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
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

export default Industries;