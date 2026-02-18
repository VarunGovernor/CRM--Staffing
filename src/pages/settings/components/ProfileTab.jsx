import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const ProfileTab = () => {
  const { user, userProfile, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    timezone: 'America/New_York',
    language: 'en',
    avatar: ''
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
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);

  // Load profile data from auth context
  useEffect(() => {
    if (userProfile) {
      const nameParts = (userProfile.full_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfileData({
        firstName,
        lastName,
        email: userProfile.email || user?.email || '',
        phone: userProfile.phone || '',
        jobTitle: userProfile.job_title || '',
        department: userProfile.department || '',
        timezone: userProfile.timezone || 'America/New_York',
        language: userProfile.language || 'en',
        avatar: userProfile.avatar_url || ''
      });
    }
  }, [userProfile, user]);

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

  // Close avatar menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setIsAvatarMenuOpen(false);
      }
    };
    if (isAvatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAvatarMenuOpen]);

  const handleAvatarUpload = () => {
    setIsAvatarMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleAvatarRemove = async () => {
    setIsAvatarMenuOpen(false);
    if (!profileData.avatar) return;

    setIsUploading(true);
    setSaveMessage(null);

    try {
      // Try to delete the file from storage
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (files?.length) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filePaths);
      }

      // Clear avatar_url in profile
      const { error } = await updateProfile({ avatar_url: null });

      if (error) {
        setSaveMessage({ type: 'error', text: `Failed to remove photo: ${error.message}` });
        return;
      }

      setProfileData(prev => ({ ...prev, avatar: '' }));
      setSaveMessage({ type: 'success', text: 'Profile photo removed.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      setSaveMessage({ type: 'error', text: 'Please upload a JPG, PNG, or GIF image.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSaveMessage({ type: 'error', text: 'File size must be under 2MB.' });
      return;
    }

    setIsUploading(true);
    setSaveMessage(null);

    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage (upsert to overwrite existing)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setSaveMessage({ type: 'error', text: `Upload failed: ${uploadError.message}` });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-buster so the browser loads the new image
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Save URL to user profile
      const { error: profileError } = await updateProfile({ avatar_url: avatarUrl });

      if (profileError) {
        setSaveMessage({ type: 'error', text: `Failed to update profile: ${profileError.message}` });
        return;
      }

      setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
      setSaveMessage({ type: 'success', text: 'Profile photo updated!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred during upload.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      const updates = {
        full_name: fullName,
        phone: profileData.phone || null,
        job_title: profileData.jobTitle || null,
        timezone: profileData.timezone,
        language: profileData.language,
        updated_at: new Date().toISOString()
      };

      const { error } = await updateProfile(updates);

      if (error) {
        setSaveMessage({ type: 'error', text: `Failed to save: ${error.message || 'Unknown error'}` });
      } else {
        setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setIsPasswordLoading(true);
    setSaveMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        setSaveMessage({ type: 'error', text: `Password change failed: ${error.message}` });
      } else {
        setSaveMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Save feedback message */}
      {saveMessage && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          saveMessage.type === 'success'
            ? 'bg-success/10 text-success border border-success/30'
            : 'bg-error/10 text-error border border-error/30'
        }`}>
          {saveMessage.text}
        </div>
      )}

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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileSelected}
            className="hidden"
          />
          <div className="flex items-center space-x-6">
            <div className="relative" ref={avatarMenuRef}>
              <div className={`w-20 h-20 rounded-full overflow-hidden bg-muted ${isUploading ? 'opacity-50' : ''}`}>
                <Image
                  src={profileData?.avatar}
                  alt={`Profile photo of ${profileData.firstName} ${profileData.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-smooth disabled:opacity-50"
                aria-label="Avatar options"
              >
                <Icon name={isUploading ? 'Loader' : 'Camera'} size={16} />
              </button>

              {/* Avatar dropdown menu */}
              {isAvatarMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={handleAvatarUpload}
                    className="flex items-center w-full px-3 py-2 text-sm text-card-foreground hover:bg-muted transition-smooth"
                  >
                    <Icon name="Upload" size={14} className="mr-2" />
                    Upload Photo
                  </button>
                  <button
                    onClick={handleAvatarRemove}
                    disabled={!profileData.avatar}
                    className={`flex items-center w-full px-3 py-2 text-sm transition-smooth ${
                      profileData.avatar
                        ? 'text-red-600 hover:bg-red-50 font-medium cursor-pointer'
                        : 'text-muted-foreground/40 cursor-not-allowed'
                    }`}
                  >
                    <Icon name="Trash2" size={14} className="mr-2" />
                    Remove Photo
                  </button>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-card-foreground">Profile Photo</h4>
              <p className="text-sm text-muted-foreground mb-2">JPG, PNG or GIF. Max size 2MB.</p>
              <Button variant="outline" size="sm" onClick={handleAvatarUpload} disabled={isUploading}>
                <Icon name={isUploading ? 'Loader' : 'Upload'} size={16} className="mr-2" />
                {isUploading ? 'Uploading...' : 'Upload New Photo'}
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
              disabled
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
            loading={isPasswordLoading}
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
