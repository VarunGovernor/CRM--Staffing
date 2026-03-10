import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { interviews as interviewsApi } from '../../../lib/database';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const US_TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern (ET)'  },
  { value: 'America/Chicago',     label: 'Central (CT)'  },
  { value: 'America/Denver',      label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)'  },
  { value: 'America/Phoenix',     label: 'Arizona (MST)' },
  { value: 'America/Anchorage',   label: 'Alaska (AKT)'  },
  { value: 'Pacific/Honolulu',    label: 'Hawaii (HST)'  },
  { value: 'UTC',                 label: 'UTC'            },
];

const INTERVIEW_STATUS_OPTIONS = [
  { value: 'scheduled',   label: 'Scheduled'   },
  { value: 'completed',   label: 'Completed'   },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'cancelled',   label: 'Cancelled'   },
  { value: 'no_show',     label: 'No Show'     },
];

const RESULT_OPTIONS = [
  { value: '',        label: 'Select Result' },
  { value: 'pending', label: 'Pending'       },
  { value: 'pass',    label: 'Pass'          },
  { value: 'fail',    label: 'Fail'          },
  { value: 'no_show', label: 'No Show'       },
  { value: 'hold',    label: 'On Hold'       },
];

const InterviewForm = ({ isOpen, onClose, interview, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!interview?.id;
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState(''); // '' | 'synced' | 'error'
  const [msConnected, setMsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('microsoft_tokens').select('user_id').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => setMsConnected(!!data));
    }
  }, [user]);

  const [formData, setFormData] = useState({
    submission_id:      '',
    candidate_id:       '',
    technology:         '',
    vendor_company:     '',
    client_name:        '',
    interview_date:     '',
    interview_time:     '',
    timezone:           'America/New_York',
    interview_mode:     'video',
    interview_round:    'round_1',
    interview_status:   'scheduled',
    mentor_id:          '',
    interviewer_name:   '',
    feedback:           '',
    result:             '',
  });

  const [submissions, setSubmissions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchDropdownData(); }, []);

  useEffect(() => {
    if (interview) {
      setFormData({
        submission_id:    interview?.submission_id    || '',
        candidate_id:     interview?.candidate_id     || '',
        technology:       interview?.technology       || '',
        vendor_company:   interview?.vendor_company   || '',
        client_name:      interview?.client_name      || '',
        interview_date:   interview?.interview_date   || '',
        interview_time:   interview?.interview_time   || '',
        timezone:         interview?.timezone         || 'America/New_York',
        interview_mode:   interview?.interview_mode   || 'video',
        interview_round:  interview?.interview_round  || 'round_1',
        interview_status: interview?.interview_status || 'scheduled',
        mentor_id:        interview?.mentor_id        || '',
        interviewer_name: interview?.interviewer_name || '',
        feedback:         interview?.feedback         || '',
        result:           interview?.result           || '',
      });
    } else {
      resetForm();
    }
  }, [interview, isOpen]);

  const fetchDropdownData = async () => {
    const [submissionsRes, mentorsRes] = await Promise.all([
      supabase?.from('submissions')
        ?.select('id, job_title, candidate:candidates(id, first_name, last_name), vendor:vendors(id, name)')
        ?.in('status', ['submitted', 'shortlisted', 'interview_scheduled', 'selected'])
        ?.order('submission_date', { ascending: false }),
      supabase?.from('user_profiles')
        ?.select('id, full_name')
        ?.in('role', ['recruiter', 'admin', 'sales'])
        ?.order('full_name'),
    ]);
    setSubmissions(submissionsRes?.data || []);
    setMentors(mentorsRes?.data || []);
  };

  const resetForm = () => {
    setFormData({
      submission_id:    '',
      candidate_id:     '',
      technology:       '',
      vendor_company:   '',
      client_name:      '',
      interview_date:   '',
      interview_time:   '',
      timezone:         'America/New_York',
      interview_mode:   'video',
      interview_round:  'round_1',
      interview_status: 'scheduled',
      mentor_id:        '',
      interviewer_name: '',
      feedback:         '',
      result:           '',
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill from submission
    if (name === 'submission_id' && value) {
      const sub = submissions?.find(s => s?.id === value);
      if (sub) {
        setFormData(prev => ({
          ...prev,
          submission_id:  value,
          candidate_id:   sub?.candidate?.id || prev.candidate_id,
          vendor_company: sub?.vendor?.name  || prev.vendor_company,
        }));
      }
    }

    if (errors?.[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData?.submission_id)    newErrors.submission_id    = 'Submission is required';
    if (!formData?.interview_date)   newErrors.interview_date   = 'Date is required';
    if (!formData?.interview_time)   newErrors.interview_time   = 'Time is required';
    if (!formData?.interview_mode)   newErrors.interview_mode   = 'Mode is required';
    if (!formData?.interview_round)  newErrors.interview_round  = 'Round is required';
    if (!formData?.interview_status) newErrors.interview_status = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    let candidateId = formData?.candidate_id;
    if (!candidateId && formData?.submission_id) {
      const sub = submissions?.find(s => s?.id === formData?.submission_id);
      candidateId = sub?.candidate?.id;
    }

    const payload = {
      submission_id:    formData?.submission_id,
      candidate_id:     candidateId,
      technology:       formData?.technology?.trim()       || null,
      vendor_company:   formData?.vendor_company?.trim()   || null,
      client_name:      formData?.client_name?.trim()      || null,
      interview_date:   formData?.interview_date,
      interview_time:   formData?.interview_time,
      timezone:         formData?.timezone                 || null,
      interview_mode:   formData?.interview_mode,
      interview_round:  formData?.interview_round,
      interview_status: formData?.interview_status,
      mentor_id:        formData?.mentor_id               || null,
      interviewer_name: formData?.interviewer_name?.trim() || null,
      feedback:         formData?.feedback?.trim()         || null,
      result:           formData?.result?.trim()           || null,
    };

    try {
      let result;
      if (isEditing) {
        result = await interviewsApi.update(interview?.id, payload);
      } else {
        result = await interviewsApi.create(payload);
      }

      if (result?.error) {
        setErrors({ general: result?.error?.message || 'Failed to save interview' });
      } else {
        const savedInterview = result?.data;

        // ── Outlook Calendar sync ─────────────────────────────
        if (syncToCalendar && msConnected && savedInterview?.id) {
          setCalendarSyncing(true);
          try {
            const interviewDatetime = `${formData.interview_date}T${formData.interview_time || '09:00'}:00`;
            // Add 1 hour for end time
            const endDate = new Date(interviewDatetime);
            endDate.setHours(endDate.getHours() + 1);
            const endDatetime = endDate.toISOString().slice(0, 19);

            const sub = submissions?.find(s => s?.id === formData.submission_id);
            const candidateName = sub?.candidate
              ? `${sub.candidate.first_name} ${sub.candidate.last_name}`
              : 'Candidate';

            const eventAction = (isEditing && interview?.outlook_event_id) ? 'update' : 'create';

            const calBody = {
              user_id: user.id,
              action: eventAction,
              interview_id: savedInterview.id,
              event_id: interview?.outlook_event_id || undefined,
              event: {
                subject: `Interview: ${candidateName} — ${formData.client_name || formData.vendor_company || 'Client'}`,
                body: `<p><b>Round:</b> ${formData.interview_round?.replace('_', ' ') || ''}</p>
                       <p><b>Mode:</b> ${formData.interview_mode}</p>
                       <p><b>Technology:</b> ${formData.technology || ''}</p>
                       <p><b>Timezone:</b> ${formData.timezone}</p>`,
                start: interviewDatetime,
                end: endDatetime,
                timezone: formData.timezone || 'America/New_York',
                location: formData.interview_mode === 'onsite' ? formData.client_name : formData.interview_mode,
                online_meeting: formData.interview_mode === 'video',
              },
            };

            const { data: calData } = await supabase.functions.invoke('outlook-calendar-event', { body: calBody });
            setCalendarStatus(calData?.error ? 'error' : 'synced');
          } catch {
            setCalendarStatus('error');
          } finally {
            setCalendarSyncing(false);
          }
        }

        onSuccess?.(savedInterview);
        onClose();
        resetForm();
        setCalendarStatus('');
      }
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading || calendarSyncing}>Cancel</Button>
      {msConnected && (
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={syncToCalendar}
            onChange={e => setSyncToCalendar(e.target.checked)}
            className="rounded"
          />
          <Icon name="Calendar" size={14} />
          Sync to Outlook Calendar
        </label>
      )}
      <Button onClick={handleSubmit} loading={isLoading || calendarSyncing} disabled={isLoading || calendarSyncing}>
        {calendarSyncing ? 'Syncing Calendar...' : isEditing ? 'Update Interview' : 'Schedule Interview'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Interview' : 'Schedule Interview'}
      description={isEditing ? 'Update interview details' : 'Schedule a new interview for a candidate'}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors?.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-red-500" />
            <p className="text-sm text-red-700">{errors?.general}</p>
          </div>
        )}

        {/* Submission */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="FileText" size={16} />
            Submission
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Submission *</label>
            <Select
              name="submission_id"
              value={formData?.submission_id}
              onChange={handleInputChange}
              disabled={isLoading}
              searchable
            >
              <option value="">Select Submission</option>
              {submissions?.map(s => (
                <option key={s?.id} value={s?.id}>
                  {s?.candidate?.first_name} {s?.candidate?.last_name} — {s?.job_title} @ {s?.vendor?.name}
                </option>
              ))}
            </Select>
            {errors?.submission_id && <p className="text-xs text-red-500">{errors?.submission_id}</p>}
          </div>
        </div>

        {/* Technology, Vendor Company, Client */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Briefcase" size={16} />
            Technology & Companies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Technology"
              name="technology"
              value={formData?.technology}
              onChange={handleInputChange}
              placeholder="Java, React, AWS..."
              disabled={isLoading}
            />
            <Input
              label="Vendor Company"
              name="vendor_company"
              value={formData?.vendor_company}
              onChange={handleInputChange}
              placeholder="Vendor / staffing company"
              disabled={isLoading}
            />
            <Input
              label="Client Name"
              name="client_name"
              value={formData?.client_name}
              onChange={handleInputChange}
              placeholder="End client company"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Calendar" size={16} />
            Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Interview Date *"
              type="date"
              name="interview_date"
              value={formData?.interview_date}
              onChange={handleInputChange}
              error={errors?.interview_date}
              required
              disabled={isLoading}
            />
            <Input
              label="Interview Time *"
              type="time"
              name="interview_time"
              value={formData?.interview_time}
              onChange={handleInputChange}
              error={errors?.interview_time}
              required
              disabled={isLoading}
            />
            {/* Timezone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Timezone</label>
              <select
                name="timezone"
                value={formData?.timezone}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {US_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            {/* Mode */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Interview Mode *</label>
              <select
                name="interview_mode"
                value={formData?.interview_mode}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="video">Video</option>
                <option value="phone">Phone</option>
                <option value="in_person">In Person (Onsite)</option>
                <option value="technical">Technical</option>
                <option value="hr_round">HR Round</option>
              </select>
              {errors?.interview_mode && <p className="text-xs text-red-500">{errors?.interview_mode}</p>}
            </div>
            {/* Round */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Interview Round *</label>
              <select
                name="interview_round"
                value={formData?.interview_round}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="round_1">Round 1</option>
                <option value="round_2">Round 2</option>
                <option value="round_3">Round 3</option>
                <option value="round_4">Round 4</option>
                <option value="final">Final Round</option>
              </select>
              {errors?.interview_round && <p className="text-xs text-red-500">{errors?.interview_round}</p>}
            </div>
            {/* Interview Status */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Interview Status *</label>
              <select
                name="interview_status"
                value={formData?.interview_status}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {INTERVIEW_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors?.interview_status && <p className="text-xs text-red-500">{errors?.interview_status}</p>}
            </div>
          </div>
        </div>

        {/* Interviewer */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="User" size={16} />
            Interviewer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Interviewer Name"
              name="interviewer_name"
              value={formData?.interviewer_name}
              onChange={handleInputChange}
              placeholder="Client-side interviewer"
              disabled={isLoading}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mentor (Internal)</label>
              <Select
                name="mentor_id"
                value={formData?.mentor_id}
                onChange={handleInputChange}
                disabled={isLoading}
                searchable
              >
                <option value="">Select Mentor</option>
                {mentors?.map(m => (
                  <option key={m?.id} value={m?.id}>{m?.full_name}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Feedback & Result */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="MessageSquare" size={16} />
            Feedback & Result
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Feedback</label>
              <textarea
                name="feedback"
                value={formData?.feedback}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Interview notes / feedback..."
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Result</label>
              <select
                name="result"
                value={formData?.result}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {RESULT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default InterviewForm;
