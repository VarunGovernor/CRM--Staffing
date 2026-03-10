import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_SCOPES   = 'openid email profile Mail.ReadWrite Mail.Send Calendars.ReadWrite offline_access';

function buildMsAuthUrl() {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  `${window.location.origin}/auth/microsoft/callback`,
    scope:         MS_SCOPES,
    response_mode: 'query',
    prompt:        'select_account',
  });
  return `${MS_AUTH_URL}?${params}`;
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

const ComposeModal = ({ onClose, onSent, userId }) => {
  const [form, setForm] = useState({ to: '', cc: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!form.to.trim()) { setError('Recipient is required.'); return; }
    if (!form.subject.trim()) { setError('Subject is required.'); return; }
    if (!form.body.trim()) { setError('Body is required.'); return; }

    setSending(true);
    setError('');

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-outlook-email', {
        body: {
          user_id: userId,
          to: form.to.trim(),
          cc: form.cc.trim() || undefined,
          subject: form.subject.trim(),
          body: form.body.replace(/\n/g, '<br>'),
          is_html: true,
        },
      });

      if (fnErr || data?.error) throw new Error(data?.error || fnErr?.message || 'Send failed');

      setSuccess(true);
      setTimeout(() => { onSent(); onClose(); }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-foreground";

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">New Email</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <Icon name="CheckCircle" size={15} /> Email sent successfully!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <Icon name="AlertCircle" size={15} /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To *</label>
            <input type="email" value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} placeholder="recipient@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">CC</label>
            <input type="email" value={form.cc} onChange={e => setForm(p => ({ ...p, cc: e.target.value }))} placeholder="cc@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Subject *</label>
            <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Message *</label>
            <textarea rows={8} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your message..." className={`${inputCls} resize-none`} />
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-border">
          <p className="text-xs text-muted-foreground">Sent from admin@byteforceit.com via Outlook</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors">Discard</button>
            <button onClick={handleSend} disabled={sending || success} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
              {sending ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Icon name="Send" size={15} />}
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Email Row ────────────────────────────────────────────────────────────────

const EmailRow = ({ email, isSelected, onClick }) => {
  const from = email.from?.emailAddress || {};
  const initials = (from.name || from.address || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isUnread = !email.isRead;

  return (
    <button
      onClick={() => onClick(email)}
      className={`w-full text-left px-5 py-4 border-b border-border hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${isUnread ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{from.name || from.address || 'Unknown'}</p>
            <span className="text-xs text-muted-foreground flex-shrink-0">{relativeTime(email.receivedDateTime)}</span>
          </div>
          <p className={`text-sm truncate ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{email.subject || '(no subject)'}</p>
          <p className="text-xs text-muted-foreground truncate">{email.bodyPreview}</p>
        </div>
        {email.hasAttachments && <Icon name="Paperclip" size={12} className="text-muted-foreground flex-shrink-0 mt-1" />}
        {isUnread && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
      </div>
    </button>
  );
};

// ─── Not Connected View ───────────────────────────────────────────────────────

const NotConnectedView = ({ onConnect, connecting }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="max-w-md w-full text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Icon name="Mail" size={36} className="text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">Connect Outlook</h2>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Connect your Microsoft Outlook account to send emails from <strong className="text-foreground">admin@byteforceit.com</strong>, manage your inbox, and sync interviews to your calendar.
      </p>

      <div className="bg-muted/30 rounded-xl p-5 mb-8 text-left">
        <p className="text-sm font-semibold text-foreground mb-3">What you'll get:</p>
        <div className="space-y-2">
          {[
            { icon: 'Send',     text: 'Send emails from admin@byteforceit.com' },
            { icon: 'Inbox',    text: 'Read and manage your Outlook inbox' },
            { icon: 'Calendar', text: 'Auto-sync interview scheduling to Outlook Calendar' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name={item.icon} size={14} className="text-primary flex-shrink-0" />
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {!import.meta.env.VITE_MICROSOFT_CLIENT_ID ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-left">
          <p className="text-sm font-semibold text-yellow-800 mb-1">Setup Required</p>
          <p className="text-xs text-yellow-700">
            Add <code className="bg-yellow-100 px-1 rounded">VITE_MICROSOFT_CLIENT_ID</code> to your <code>.env</code> file.
            See the setup guide in <code>supabase/functions/microsoft-oauth/index.ts</code>.
          </p>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={connecting}
          className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {connecting ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1h10v10H1z" fill="#f35325"/>
              <path d="M12 1h10v10H12z" fill="#81bc06"/>
              <path d="M1 12h10v10H1z" fill="#05a6f0"/>
              <path d="M12 12h10v10H12z" fill="#ffba08"/>
            </svg>
          )}
          {connecting ? 'Connecting...' : 'Connect with Microsoft'}
        </button>
      )}
    </div>
  </div>
);

// ─── Main Emails Page ─────────────────────────────────────────────────────────

const EmailsPage = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [msEmail, setMsEmail] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  useEffect(() => {
    if (user) checkConnection();
  }, [user]);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'MICROSOFT_OAUTH_SUCCESS') {
        setIsConnected(true);
        setMsEmail(event.data.ms_email || '');
        setConnecting(false);
        fetchSentEmails();
      }
      if (event.data?.type === 'MICROSOFT_OAUTH_ERROR') {
        setConnecting(false);
        alert(`Connection failed: ${event.data.error}`);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const checkConnection = async () => {
    try {
      const { data } = await supabase
        .from('microsoft_tokens')
        .select('ms_email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setIsConnected(true);
        setMsEmail(data.ms_email || '');
        await fetchSentEmails();
      }
    } catch (err) {
      console.error('Check connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectOutlook = () => {
    const url = buildMsAuthUrl();
    if (!url) return;
    setConnecting(true);
    const popup = window.open(url, 'microsoft-oauth', 'width=600,height=700,scrollbars=yes');
    if (!popup) window.location.href = url;
  };

  const disconnectOutlook = async () => {
    if (!confirm('Disconnect your Outlook account? You will need to reconnect to send emails.')) return;
    await supabase.functions.invoke('microsoft-oauth', {
      body: { action: 'revoke', user_id: user.id },
    });
    setIsConnected(false);
    setEmails([]);
    setSentEmails([]);
    setSelectedEmail(null);
    setLoading(false);
  };

  const fetchSentEmails = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('sent_emails')
        .select('*')
        .eq('sent_by', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      setSentEmails((data || []).map(e => ({
        id: e.id,
        subject: e.subject,
        body: { content: e.body, contentType: 'html' },
        bodyPreview: (e.body || '').replace(/<[^>]*>/g, '').slice(0, 120),
        receivedDateTime: e.sent_at,
        isRead: true,
        from: { emailAddress: { name: 'You', address: e.to_address } },
        _isSent: true,
        _toAddress: e.to_address,
        _ccAddress: e.cc_address,
      })));
    } catch (err) {
      console.warn('Sent emails fetch:', err.message);
    }
  };

  const displayEmails = activeTab === 'inbox' ? emails : sentEmails;

  const filteredEmails = useMemo(() => {
    if (!searchTerm) return displayEmails;
    const t = searchTerm.toLowerCase();
    return displayEmails.filter(e =>
      (e.subject || '').toLowerCase().includes(t) ||
      (e.from?.emailAddress?.name || '').toLowerCase().includes(t) ||
      (e.from?.emailAddress?.address || '').toLowerCase().includes(t) ||
      (e.bodyPreview || '').toLowerCase().includes(t)
    );
  }, [displayEmails, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="h-[calc(100vh-4rem)] flex flex-col">

          {/* Page Header */}
          <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Emails</h1>
              {isConnected && msEmail && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connected: <span className="text-primary font-medium">{msEmail}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <button
                    onClick={() => setIsComposeOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Icon name="Pencil" size={15} />
                    Compose
                  </button>
                  <button
                    onClick={disconnectOutlook}
                    className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                    title="Disconnect Outlook"
                  >
                    <Icon name="Unlink" size={14} />
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !isConnected ? (
            <NotConnectedView onConnect={connectOutlook} connecting={connecting} />
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Left panel */}
              <div className="w-full lg:w-[380px] flex flex-col border-r border-border flex-shrink-0">
                {/* Tabs */}
                <div className="flex border-b border-border">
                  {[
                    { key: 'inbox', label: 'Inbox',    badge: emails.filter(e => !e.isRead).length },
                    { key: 'sent',  label: 'Sent',     badge: 0 },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {tab.label}
                      {tab.badge > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">{tab.badge}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    />
                  </div>
                </div>

                {/* Email list */}
                <div className="flex-1 overflow-y-auto">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center">
                      <Icon name="Mail" size={32} className="mx-auto mb-2 text-muted-foreground opacity-40" />
                      <p className="text-sm text-muted-foreground">
                        {activeTab === 'inbox'
                          ? 'Inbox integration requires Microsoft Graph proxy setup.'
                          : 'No sent emails yet. Compose your first email!'}
                      </p>
                      {activeTab === 'inbox' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent emails appear in the Sent tab once dispatched.
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredEmails.map(email => (
                      <EmailRow key={email.id} email={email} isSelected={selectedEmail?.id === email.id} onClick={setSelectedEmail} />
                    ))
                  )}
                </div>
              </div>

              {/* Right panel */}
              <div className="hidden lg:flex lg:flex-1 flex-col bg-muted/10">
                {selectedEmail ? (
                  <>
                    <div className="p-6 border-b border-border bg-background">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h2 className="text-xl font-semibold text-foreground leading-snug flex-1">{selectedEmail.subject || '(no subject)'}</h2>
                        <button
                          onClick={() => setIsComposeOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
                        >
                          <Icon name="Reply" size={13} /> Reply
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                          {(selectedEmail.from?.emailAddress?.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{selectedEmail.from?.emailAddress?.name || selectedEmail.from?.emailAddress?.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedEmail._isSent ? `To: ${selectedEmail._toAddress}` : selectedEmail.from?.emailAddress?.address}
                            {' · '}
                            {selectedEmail.receivedDateTime ? new Date(selectedEmail.receivedDateTime).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                      {selectedEmail.body?.contentType === 'html' ? (
                        <div
                          className="prose prose-sm max-w-none text-foreground"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.body.content }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                          {selectedEmail.body?.content || selectedEmail.bodyPreview}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="Mail" size={48} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                      <p className="text-muted-foreground text-sm">Select an email to read</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isComposeOpen && (
          <ComposeModal userId={user?.id} onClose={() => setIsComposeOpen(false)} onSent={fetchSentEmails} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailsPage;
