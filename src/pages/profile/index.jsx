import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Image from '../../components/AppImage';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const ProfileSettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, userProfile, updateProfile } = useAuth();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    jobTitle: '',
    timezone: 'America/New_York',
    language: 'en',
    avatar: '',
    reportsTo: ''
  });

  const [managerOptions, setManagerOptions] = useState([]);

  const [notifications, setNotifications] = useState({
    emailDeals: true,
    emailActivities: true,
    emailReports: false,
    pushDeals: true,
    pushActivities: false,
    pushReports: false,
    smsReminders: false,
    weeklyDigest: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Load user data from profile
  useEffect(() => {
    if (userProfile) {
      const nameParts = (userProfile.full_name || '').split(' ');
      setProfileData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: userProfile.phone || '',
        jobTitle: userProfile.job_title || '',
        timezone: userProfile.timezone || 'America/New_York',
        language: userProfile.language || 'en',
        avatar: userProfile.avatar_url || '',
        reportsTo: userProfile.reports_to || ''
      }));
    }
  }, [userProfile]);

  // Load potential managers for "Reports To" dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'hr', 'sales', 'recruiter'])
        .eq('is_active', true)
        .order('full_name');

      if (data) {
        setManagerOptions(
          data
            .filter(m => m.id !== user?.id)
            .map(m => ({
              value: m.id,
              label: `${m.full_name} (${m.role})`
            }))
        );
      }
    };
    if (user?.id) fetchManagers();
  }, [user?.id]);

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' }
  ];

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setSaveMessage(null);
  };

  const handleNotificationChange = (field, checked) => {
    setNotifications(prev => ({ ...prev, [field]: checked }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setPasswordMessage(null);
  };

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          setSaveMessage({ type: 'error', text: 'File size must be under 2MB' });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileData(prev => ({ ...prev, avatar: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      const { error } = await updateProfile({
        full_name: fullName,
        phone: profileData.phone,
        job_title: profileData.jobTitle,
        timezone: profileData.timezone,
        language: profileData.language,
        reports_to: profileData.reportsTo || null
      });
      if (error) {
        setSaveMessage({ type: 'error', text: error.message || 'Failed to save profile' });
      } else {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    setIsChangingPassword(true);
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) {
        setPasswordMessage({ type: 'error', text: error.message });
      } else {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = userProfile?.full_name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-8 max-w-4xl"
        >
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="User" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your personal information and preferences</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Profile Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-6">
                <Icon name="User" size={24} className="text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">Update your name, photo, and contact details</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                      {profileData.avatar ? (
                        <Image
                          src={profileData.avatar}
                          alt={`Profile photo of ${profileData.firstName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center">
                          <span className="text-2xl font-semibold text-primary-foreground">{initials}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAvatarUpload}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-smooth"
                      aria-label="Upload new avatar"
                    >
                      <Icon name="Camera" size={16} />
                    </button>
                  </div>
                  <div>
                    <h4 className="font-medium text-card-foreground">Profile Photo</h4>
                    <p className="text-sm text-muted-foreground mb-2">JPG, PNG or GIF. Max size 2MB.</p>
                    <Button variant="outline" size="sm" onClick={handleAvatarUpload}>
                      <Icon name="Upload" size={16} className="mr-2" />
                      Upload New Photo
                    </Button>
                  </div>
                </div>

                {/* Name & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    description="Email cannot be changed from this page"
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Role display (read-only) */}
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="Shield" size={18} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Role: <span className="capitalize">{userProfile?.role?.replace('_', ' ') || 'Employee'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your role and permissions are managed by your administrator
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reports To (Manager) */}
                <Select
                  label="Reports To"
                  options={[{ value: '', label: 'No Manager Assigned' }, ...managerOptions]}
                  value={profileData.reportsTo}
                  onChange={(value) => handleProfileChange('reportsTo', value)}
                />

                {/* Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Timezone"
                    options={timezoneOptions}
                    value={profileData.timezone}
                    onChange={(value) => handleProfileChange('timezone', value)}
                  />
                  <Select
                    label="Language"
                    options={languageOptions}
                    value={profileData.language}
                    onChange={(value) => handleProfileChange('language', value)}
                  />
                </div>

                {/* Save Message */}
                {saveMessage && (
                  <div className={`flex items-center space-x-2 text-sm px-4 py-3 rounded-lg ${
                    saveMessage.type === 'success'
                      ? 'bg-success/10 text-success'
                      : 'bg-error/10 text-error'
                  }`}>
                    <Icon name={saveMessage.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={16} />
                    <span>{saveMessage.text}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="default"
                    onClick={handleSaveProfile}
                    loading={isSaving}
                    iconName="Save"
                    iconPosition="left"
                  >
                    Save Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-6">
                <Icon name="Bell" size={24} className="text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">Choose how you want to be notified about updates</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-card-foreground mb-4">Email Notifications</h4>
                  <div className="space-y-3">
                    <Checkbox
                      label="Deal Updates"
                      description="Get notified when deals are created, updated, or closed"
                      checked={notifications.emailDeals}
                      onChange={(e) => handleNotificationChange('emailDeals', e.target.checked)}
                    />
                    <Checkbox
                      label="Activity Reminders"
                      description="Receive reminders for upcoming tasks and meetings"
                      checked={notifications.emailActivities}
                      onChange={(e) => handleNotificationChange('emailActivities', e.target.checked)}
                    />
                    <Checkbox
                      label="Weekly Reports"
                      description="Get weekly performance and pipeline reports"
                      checked={notifications.emailReports}
                      onChange={(e) => handleNotificationChange('emailReports', e.target.checked)}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-4">Push Notifications</h4>
                  <div className="space-y-3">
                    <Checkbox
                      label="Deal Updates"
                      description="Browser notifications for important deal changes"
                      checked={notifications.pushDeals}
                      onChange={(e) => handleNotificationChange('pushDeals', e.target.checked)}
                    />
                    <Checkbox
                      label="Activity Reminders"
                      description="Desktop notifications for upcoming activities"
                      checked={notifications.pushActivities}
                      onChange={(e) => handleNotificationChange('pushActivities', e.target.checked)}
                    />
                    <Checkbox
                      label="System Alerts"
                      description="Important system updates and maintenance notices"
                      checked={notifications.pushReports}
                      onChange={(e) => handleNotificationChange('pushReports', e.target.checked)}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-4">Other Notifications</h4>
                  <div className="space-y-3">
                    <Checkbox
                      label="SMS Reminders"
                      description="Text message reminders for critical activities"
                      checked={notifications.smsReminders}
                      onChange={(e) => handleNotificationChange('smsReminders', e.target.checked)}
                    />
                    <Checkbox
                      label="Weekly Digest"
                      description="Summary of your week's activities and achievements"
                      checked={notifications.weeklyDigest}
                      onChange={(e) => handleNotificationChange('weeklyDigest', e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-6">
                <Icon name="Lock" size={24} className="text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Change Password</h3>
                  <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  description="Must be at least 8 characters with uppercase, lowercase, and numbers"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  required
                />

                {passwordMessage && (
                  <div className={`flex items-center space-x-2 text-sm px-4 py-3 rounded-lg ${
                    passwordMessage.type === 'success'
                      ? 'bg-success/10 text-success'
                      : 'bg-error/10 text-error'
                  }`}>
                    <Icon name={passwordMessage.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={16} />
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <Button
                  variant="default"
                  onClick={handleChangePassword}
                  loading={isChangingPassword}
                  iconName="Shield"
                  iconPosition="left"
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfileSettings;
