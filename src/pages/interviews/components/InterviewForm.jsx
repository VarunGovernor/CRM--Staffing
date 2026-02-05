import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { interviews as interviewsApi } from '../../../lib/database';
import { supabase } from '../../../lib/supabase';

const InterviewForm = ({ isOpen, onClose, interview, onSuccess }) => {
  const isEditing = !!interview?.id;

  const [formData, setFormData] = useState({
    submission_id: '',
    candidate_id: '',
    interview_date: '',
    interview_time: '',
    interview_mode: 'video',
    interview_round: 'round_1',
    mentor_id: '',
    interviewer_name: '',
    feedback: '',
    result: ''
  });

  const [submissions, setSubmissions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (interview) {
      setFormData({
        submission_id: interview?.submission_id || '',
        candidate_id: interview?.candidate_id || '',
        interview_date: interview?.interview_date || '',
        interview_time: interview?.interview_time || '',
        interview_mode: interview?.interview_mode || 'video',
        interview_round: interview?.interview_round || 'round_1',
        mentor_id: interview?.mentor_id || '',
        interviewer_name: interview?.interviewer_name || '',
        feedback: interview?.feedback || '',
        result: interview?.result || ''
      });
    } else {
      resetForm();
    }
  }, [interview, isOpen]);

  const fetchDropdownData = async () => {
    const [submissionsRes, mentorsRes] = await Promise.all([
      supabase?.from('submissions')
        ?.select('id, job_title, candidate:candidates(id, first_name, last_name), vendor:vendors(name)')
        ?.in('status', ['submitted', 'shortlisted', 'interview_scheduled'])
        ?.order('submission_date', { ascending: false }),
      supabase?.from('user_profiles')
        ?.select('id, full_name')
        ?.in('role', ['recruiter', 'admin', 'sales'])
        ?.order('full_name')
    ]);

    setSubmissions(submissionsRes?.data || []);
    setMentors(mentorsRes?.data || []);
  };

  const resetForm = () => {
    setFormData({
      submission_id: '',
      candidate_id: '',
      interview_date: '',
      interview_time: '',
      interview_mode: 'video',
      interview_round: 'round_1',
      mentor_id: '',
      interviewer_name: '',
      feedback: '',
      result: ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill candidate_id when submission is selected
    if (name === 'submission_id' && value) {
      const selectedSubmission = submissions?.find(s => s?.id === value);
      if (selectedSubmission?.candidate?.id) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          candidate_id: selectedSubmission?.candidate?.id
        }));
      }
    }

    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.submission_id) newErrors.submission_id = 'Submission is required';
    if (!formData?.interview_date) newErrors.interview_date = 'Date is required';
    if (!formData?.interview_time) newErrors.interview_time = 'Time is required';
    if (!formData?.interview_mode) newErrors.interview_mode = 'Mode is required';
    if (!formData?.interview_round) newErrors.interview_round = 'Round is required';

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Get candidate_id from submission if not set
    let candidateId = formData?.candidate_id;
    if (!candidateId && formData?.submission_id) {
      const selectedSubmission = submissions?.find(s => s?.id === formData?.submission_id);
      candidateId = selectedSubmission?.candidate?.id;
    }

    const payload = {
      submission_id: formData?.submission_id,
      candidate_id: candidateId,
      interview_date: formData?.interview_date,
      interview_time: formData?.interview_time,
      interview_mode: formData?.interview_mode,
      interview_round: formData?.interview_round,
      mentor_id: formData?.mentor_id || null,
      interviewer_name: formData?.interviewer_name?.trim() || null,
      feedback: formData?.feedback?.trim() || null,
      result: formData?.result?.trim() || null
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
        onSuccess?.(result?.data);
        onClose();
        resetForm();
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} loading={isLoading} disabled={isLoading}>
        {isEditing ? 'Update Interview' : 'Schedule Interview'}
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-red-500" />
              <p className="text-sm text-red-700">{errors?.general}</p>
            </div>
          </div>
        )}

        {/* Submission Selection */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="FileText" size={16} />
            Submission Details
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Submission *</label>
            <Select
              name="submission_id"
              value={formData?.submission_id}
              onChange={handleInputChange}
              disabled={isLoading}
            >
              <option value="">Select Submission</option>
              {submissions?.map(s => (
                <option key={s?.id} value={s?.id}>
                  {s?.candidate?.first_name} {s?.candidate?.last_name} - {s?.job_title} @ {s?.vendor?.name}
                </option>
              ))}
            </Select>
            {errors?.submission_id && (
              <p className="text-xs text-red-500">{errors?.submission_id}</p>
            )}
          </div>
        </div>

        {/* Interview Schedule */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Calendar" size={16} />
            Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Interview Date"
              type="date"
              name="interview_date"
              value={formData?.interview_date}
              onChange={handleInputChange}
              error={errors?.interview_date}
              required
              disabled={isLoading}
            />
            <Input
              label="Interview Time"
              type="time"
              name="interview_time"
              value={formData?.interview_time}
              onChange={handleInputChange}
              error={errors?.interview_time}
              required
              disabled={isLoading}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Interview Mode *</label>
              <Select
                name="interview_mode"
                value={formData?.interview_mode}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="in_person">In Person</option>
                <option value="technical">Technical</option>
                <option value="hr_round">HR Round</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Interview Round *</label>
              <Select
                name="interview_round"
                value={formData?.interview_round}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="round_1">Round 1</option>
                <option value="round_2">Round 2</option>
                <option value="round_3">Round 3</option>
                <option value="final">Final</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Interviewer Details */}
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
              placeholder="Client interviewer name"
              disabled={isLoading}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mentor (Internal)</label>
              <Select
                name="mentor_id"
                value={formData?.mentor_id}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Mentor</option>
                {mentors?.map(m => (
                  <option key={m?.id} value={m?.id}>{m?.full_name}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Feedback & Result (for editing) */}
        {isEditing && (
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
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Interview feedback..."
                  disabled={isLoading}
                />
              </div>
              <Input
                label="Result"
                name="result"
                value={formData?.result}
                onChange={handleInputChange}
                placeholder="Pass, Fail, Pending, etc."
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default InterviewForm;
