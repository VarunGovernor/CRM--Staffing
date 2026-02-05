import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ProfileTab = () => {
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@company.com",
    phone: "+1 (555) 123-4567",
    jobTitle: "Sales Manager",
    department: "Sales",
    timezone: "America/New_York",
    language: "en",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  });

  const [notifications, setNotifications] = useState({
    emailDeals: true,
    emailActivities: true,
    emailReports: false,
    pushDeals: true,
    pushActivities: false,
    pushReports: false,
    smsReminders: true,
    weeklyDigest: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const timezoneOptions = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" }
  ];

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" }
  ];

  const departmentOptions = [
    { value: "Sales", label: "Sales" },
    { value: "Marketing", label: "Marketing" },
    { value: "Customer Success", label: "Customer Success" },
    { value: "Operations", label: "Operations" },
    { value: "Finance", label: "Finance" },
    { value: "HR", label: "Human Resources" },
    { value: "IT", label: "Information Technology" }
  ];

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, checked) => {
    setNotifications(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = () => {
    // Mock avatar upload functionality
    console.log('Avatar upload clicked');
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Mock save functionality
    setTimeout(() => {
      setIsLoading(false);
      console.log('Profile saved successfully');
    }, 1000);
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    // Mock password change functionality
    setTimeout(() => {
      setIsLoading(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      console.log('Password changed successfully');
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Icon name="User" size={24} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Profile Information</h3>
            <p className="text-sm text-muted-foreground">Update your personal details and preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                <Image
                  src={profileData?.avatar}
                  alt="Professional headshot of John Doe in business attire"
                  className="w-full h-full object-cover"
                />
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

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={profileData?.firstName}
              onChange={(e) => handleProfileChange('firstName', e?.target?.value)}
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={profileData?.lastName}
              onChange={(e) => handleProfileChange('lastName', e?.target?.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={profileData?.email}
              onChange={(e) => handleProfileChange('email', e?.target?.value)}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={profileData?.phone}
              onChange={(e) => handleProfileChange('phone', e?.target?.value)}
            />
            <Input
              label="Job Title"
              type="text"
              value={profileData?.jobTitle}
              onChange={(e) => handleProfileChange('jobTitle', e?.target?.value)}
            />
            <Select
              label="Department"
              options={departmentOptions}
              value={profileData?.department}
              onChange={(value) => handleProfileChange('department', value)}
            />
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Timezone"
              options={timezoneOptions}
              value={profileData?.timezone}
              onChange={(value) => handleProfileChange('timezone', value)}
              searchable
            />
            <Select
              label="Language"
              options={languageOptions}
              value={profileData?.language}
              onChange={(value) => handleProfileChange('language', value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="default"
              onClick={handleSaveProfile}
              loading={isLoading}
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
          {/* Email Notifications */}
          <div>
            <h4 className="font-medium text-card-foreground mb-4">Email Notifications</h4>
            <div className="space-y-3">
              <Checkbox
                label="Deal Updates"
                description="Get notified when deals are created, updated, or closed"
                checked={notifications?.emailDeals}
                onChange={(e) => handleNotificationChange('emailDeals', e?.target?.checked)}
              />
              <Checkbox
                label="Activity Reminders"
                description="Receive reminders for upcoming tasks and meetings"
                checked={notifications?.emailActivities}
                onChange={(e) => handleNotificationChange('emailActivities', e?.target?.checked)}
              />
              <Checkbox
                label="Weekly Reports"
                description="Get weekly performance and pipeline reports"
                checked={notifications?.emailReports}
                onChange={(e) => handleNotificationChange('emailReports', e?.target?.checked)}
              />
            </div>
          </div>

          {/* Push Notifications */}
          <div>
            <h4 className="font-medium text-card-foreground mb-4">Push Notifications</h4>
            <div className="space-y-3">
              <Checkbox
                label="Deal Updates"
                description="Browser notifications for important deal changes"
                checked={notifications?.pushDeals}
                onChange={(e) => handleNotificationChange('pushDeals', e?.target?.checked)}
              />
              <Checkbox
                label="Activity Reminders"
                description="Desktop notifications for upcoming activities"
                checked={notifications?.pushActivities}
                onChange={(e) => handleNotificationChange('pushActivities', e?.target?.checked)}
              />
              <Checkbox
                label="System Alerts"
                description="Important system updates and maintenance notices"
                checked={notifications?.pushReports}
                onChange={(e) => handleNotificationChange('pushReports', e?.target?.checked)}
              />
            </div>
          </div>

          {/* Other Notifications */}
          <div>
            <h4 className="font-medium text-card-foreground mb-4">Other Notifications</h4>
            <div className="space-y-3">
              <Checkbox
                label="SMS Reminders"
                description="Text message reminders for critical activities"
                checked={notifications?.smsReminders}
                onChange={(e) => handleNotificationChange('smsReminders', e?.target?.checked)}
              />
              <Checkbox
                label="Weekly Digest"
                description="Summary of your week's activities and achievements"
                checked={notifications?.weeklyDigest}
                onChange={(e) => handleNotificationChange('weeklyDigest', e?.target?.checked)}
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
            value={passwordData?.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e?.target?.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordData?.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e?.target?.value)}
            description="Must be at least 8 characters with uppercase, lowercase, and numbers"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData?.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e?.target?.value)}
            required
          />

          <Button
            variant="default"
            onClick={handleChangePassword}
            loading={isLoading}
            iconName="Shield"
            iconPosition="left"
          >
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;