import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const TeamTab = () => {
  const [teamMembers, setTeamMembers] = useState([
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@company.com",
    role: "Admin",
    department: "Sales",
    status: "Active",
    lastActive: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1538155421123-6a79813f5deb",
    avatarAlt: "Professional headshot of John Doe in business suit"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Manager",
    department: "Sales",
    status: "Active",
    lastActive: "1 day ago",
    avatar: "https://images.unsplash.com/photo-1684262855358-88f296a2cfc2",
    avatarAlt: "Professional headshot of Sarah Johnson with blonde hair in navy blazer"
  },
  {
    id: 3,
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "User",
    department: "Marketing",
    status: "Active",
    lastActive: "3 hours ago",
    avatar: "https://images.unsplash.com/photo-1629272039203-7d76fdaf1324",
    avatarAlt: "Professional headshot of Michael Chen in dark suit with friendly smile"
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    role: "User",
    department: "Customer Success",
    status: "Invited",
    lastActive: "Pending",
    avatar: "https://images.unsplash.com/photo-1734456611474-13245d164868",
    avatarAlt: "Professional headshot of Emily Rodriguez with dark hair in professional attire"
  }]
  );

  const [inviteData, setInviteData] = useState({
    email: "",
    role: "User",
    department: "Sales"
  });

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roleOptions = [
  { value: "Admin", label: "Admin", description: "Full access to all features and settings" },
  { value: "Manager", label: "Manager", description: "Manage team members and view all data" },
  { value: "User", label: "User", description: "Standard access to CRM features" },
  { value: "Viewer", label: "Viewer", description: "Read-only access to reports and data" }];


  const departmentOptions = [
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
  { value: "Customer Success", label: "Customer Success" },
  { value: "Operations", label: "Operations" },
  { value: "Finance", label: "Finance" },
  { value: "HR", label: "Human Resources" }];


  const handleInviteChange = (field, value) => {
    setInviteData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendInvite = async () => {
    setIsLoading(true);
    // Mock invite functionality
    setTimeout(() => {
      const newMember = {
        id: teamMembers?.length + 1,
        name: inviteData?.email?.split('@')?.[0]?.replace('.', ' ')?.replace(/\b\w/g, (l) => l?.toUpperCase()),
        email: inviteData?.email,
        role: inviteData?.role,
        department: inviteData?.department,
        status: "Invited",
        lastActive: "Pending",
        avatar: "https://images.unsplash.com/photo-1602241470511-879ce3890853",
        avatarAlt: "Default avatar placeholder for new team member"
      };

      setTeamMembers((prev) => [...prev, newMember]);
      setInviteData({ email: "", role: "User", department: "Sales" });
      setIsInviteModalOpen(false);
      setIsLoading(false);
      console.log('Invite sent successfully');
    }, 1000);
  };

  const handleRoleChange = (memberId, newRole) => {
    setTeamMembers((prev) => prev?.map((member) =>
    member?.id === memberId ? { ...member, role: newRole } : member
    ));
  };

  const handleRemoveMember = (memberId) => {
    setTeamMembers((prev) => prev?.filter((member) => member?.id !== memberId));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: { bg: 'bg-success/10', text: 'text-success', icon: 'CheckCircle' },
      Invited: { bg: 'bg-warning/10', text: 'text-warning', icon: 'Clock' },
      Inactive: { bg: 'bg-muted', text: 'text-muted-foreground', icon: 'XCircle' }
    };

    const config = statusConfig?.[status] || statusConfig?.Inactive;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.bg} ${config?.text}`}>
        <Icon name={config?.icon} size={12} className="mr-1" />
        {status}
      </span>);

  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      Admin: { bg: 'bg-error/10', text: 'text-error' },
      Manager: { bg: 'bg-primary/10', text: 'text-primary' },
      User: { bg: 'bg-accent/10', text: 'text-accent-foreground' },
      Viewer: { bg: 'bg-muted', text: 'text-muted-foreground' }
    };

    const config = roleConfig?.[role] || roleConfig?.User;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.bg} ${config?.text}`}>
        {role}
      </span>);

  };

  return (
    <div className="space-y-8">
      {/* Team Overview */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Icon name="Users" size={24} className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Team Management</h3>
              <p className="text-sm text-muted-foreground">Manage team members, roles, and permissions</p>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => setIsInviteModalOpen(true)}
            iconName="UserPlus"
            iconPosition="left">

            Invite Member
          </Button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Users" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-card-foreground">{teamMembers?.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Icon name="CheckCircle" size={20} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-card-foreground">
                  {teamMembers?.filter((m) => m?.status === 'Active')?.length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Icon name="Clock" size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-card-foreground">
                  {teamMembers?.filter((m) => m?.status === 'Invited')?.length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                <Icon name="Shield" size={20} className="text-error" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-card-foreground">
                  {teamMembers?.filter((m) => m?.role === 'Admin')?.length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Member</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Active</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers?.map((member) =>
              <tr key={member?.id} className="border-b border-border hover:bg-muted/50 transition-smooth">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                        <Image
                        src={member?.avatar}
                        alt={member?.avatarAlt}
                        className="w-full h-full object-cover" />

                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{member?.name}</p>
                        <p className="text-sm text-muted-foreground">{member?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Select
                    options={roleOptions}
                    value={member?.role}
                    onChange={(value) => handleRoleChange(member?.id, value)}
                    className="w-32" />

                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-card-foreground">{member?.department}</span>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(member?.status)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">{member?.lastActive}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => console.log('Edit member', member?.id)}
                      aria-label="Edit member">

                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member?.id)}
                      aria-label="Remove member">

                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Invite Modal */}
      {isInviteModalOpen &&
      <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsInviteModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">Invite Team Member</h3>
                <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsInviteModalOpen(false)}
                aria-label="Close modal">

                  <Icon name="X" size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                label="Email Address"
                type="email"
                value={inviteData?.email}
                onChange={(e) => handleInviteChange('email', e?.target?.value)}
                placeholder="colleague@company.com"
                required />

                <Select
                label="Role"
                options={roleOptions}
                value={inviteData?.role}
                onChange={(value) => handleInviteChange('role', value)} />

                <Select
                label="Department"
                options={departmentOptions}
                value={inviteData?.department}
                onChange={(value) => handleInviteChange('department', value)} />


                <div className="flex space-x-3 pt-4">
                  <Button
                  variant="outline"
                  onClick={() => setIsInviteModalOpen(false)}
                  fullWidth>

                    Cancel
                  </Button>
                  <Button
                  variant="default"
                  onClick={handleSendInvite}
                  loading={isLoading}
                  iconName="Send"
                  iconPosition="left"
                  fullWidth>

                    Send Invite
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      }
    </div>);

};

export default TeamTab;