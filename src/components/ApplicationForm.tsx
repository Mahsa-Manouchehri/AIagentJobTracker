import React, { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { parseJobDescription, ParsedJobInfo, isValidSalaryRange } from '../utils/parser';

import { X, Sparkles, Building2, Briefcase, MapPin, DollarSign, FileText, Check, AlertCircle } from 'lucide-react';

interface ApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => void;
  initialData?: JobApplication | null;
}

const ALL_STATUSES: ApplicationStatus[] = ['Applied', 'Interview', 'Assessment', 'Offer', 'Rejected', 'Withdrawn'];

export default function ApplicationForm({ isOpen, onClose, onSubmit, initialData }: ApplicationFormProps) {
  // Main form fields
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [location, setLocation] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Applied');

  // Input validation errors
  const [errors, setErrors] = useState<{
    companyName?: string;
    jobTitle?: string;
    salaryRange?: string;
    location?: string;
    jobDescription?: string;
    notes?: string;
  }>({});

  // Parser preview state
  const [parsedInfo, setParsedInfo] = useState<ParsedJobInfo | null>(null);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  // Sync initialData if editing
  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.company_name || '');
      setJobTitle(initialData.job_title || '');
      setSalaryRange(initialData.salary_range || '');
      setLocation(initialData.location || '');
      setJobDescription(initialData.job_description || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.application_status || 'Applied');
    } else {
      // Clear form
      setCompanyName('');
      setJobTitle('');
      setSalaryRange('');
      setLocation('');
      setJobDescription('');
      setNotes('');
      setStatus('Applied');
    }
    setParsedInfo(null);
    setParseNotice(null);
    setErrors({});
  }, [initialData, isOpen]);

  // Real-time Input Validation Handlers
  const handleCompanyChange = (val: string) => {
    setCompanyName(val);
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, companyName: 'Company Name is required.' }));
    } else if (val.length > 100) {
      setErrors(prev => ({ ...prev, companyName: `Company Name must be 100 characters or less (currently ${val.length}).` }));
    } else {
      setErrors(prev => {
        const { companyName, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleTitleChange = (val: string) => {
    setJobTitle(val);
    if (!val.trim()) {
      setErrors(prev => ({ ...prev, jobTitle: 'Job Title is required.' }));
    } else if (val.length > 100) {
      setErrors(prev => ({ ...prev, jobTitle: `Job Title must be 100 characters or less (currently ${val.length}).` }));
    } else {
      setErrors(prev => {
        const { jobTitle, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    if (val.length > 100) {
      setErrors(prev => ({ ...prev, location: `Location must be 100 characters or less (currently ${val.length}).` }));
    } else {
      setErrors(prev => {
        const { location, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSalaryChange = (val: string) => {
    setSalaryRange(val);
    if (val.length > 50) {
      setErrors(prev => ({ ...prev, salaryRange: `Salary Range must be 50 characters or less (currently ${val.length}).` }));
    } else if (!isValidSalaryRange(val)) {
      setErrors(prev => ({ ...prev, salaryRange: 'Salary Range must follow a valid format (e.g., 100K, 80k-100k, 80000, or £80/hr). Multiple K characters or additional letters are not allowed.' }));
    } else {
      setErrors(prev => {
        const { salaryRange, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (val.length > 1000) {
      setErrors(prev => ({ ...prev, notes: `Notes must be 1000 characters or less (currently ${val.length}).` }));
    } else {
      setErrors(prev => {
        const { notes, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle live job description analysis
  const handleDescriptionChange = (text: string) => {
    setJobDescription(text);
    if (text.length > 5000) {
      setErrors(prev => ({ ...prev, jobDescription: `Job Description must be 5000 characters or less (currently ${text.length}).` }));
    } else {
      setErrors(prev => {
        const { jobDescription, ...rest } = prev;
        return rest;
      });
    }

    if (!text.trim()) {
      setParsedInfo(null);
      return;
    }

    // Parse immediately for preview
    const parsed = parseJobDescription(text);
    setParsedInfo(parsed);
  };

  // Apply parsed fields to the form
  const applyParsedValues = () => {
    if (!parsedInfo) return;

    let appliedCount = 0;

    if (parsedInfo.jobTitle && !jobTitle) {
      handleTitleChange(parsedInfo.jobTitle);
      appliedCount++;
    }
    if (parsedInfo.salaryRange && !salaryRange) {
      handleSalaryChange(parsedInfo.salaryRange);
      appliedCount++;
    }
    if (parsedInfo.location && (!location || location === 'Remote / Unspecified')) {
      handleLocationChange(parsedInfo.location);
      appliedCount++;
    }

    if (appliedCount > 0) {
      setParseNotice(`Applied ${appliedCount} extracted attributes (Title, Salary or Location) to form! You can still edit them manually.`);
    } else {
      // Force apply even if they are filled
      if (parsedInfo.jobTitle) handleTitleChange(parsedInfo.jobTitle);
      if (parsedInfo.salaryRange) handleSalaryChange(parsedInfo.salaryRange);
      if (parsedInfo.location) handleLocationChange(parsedInfo.location);
      setParseNotice(`Overwrote fields with extracted values.`);
    }

    setTimeout(() => {
      setParseNotice(null);
    }, 5000);
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company Name is required.';
    } else if (companyName.length > 100) {
      newErrors.companyName = `Company Name must be 100 characters or less (currently ${companyName.length}).`;
    }

    if (!jobTitle.trim()) {
      newErrors.jobTitle = 'Job Title is required.';
    } else if (jobTitle.length > 100) {
      newErrors.jobTitle = `Job Title must be 100 characters or less (currently ${jobTitle.length}).`;
    }

    if (location.length > 100) {
      newErrors.location = `Location must be 100 characters or less (currently ${location.length}).`;
    }

    if (salaryRange.length > 50) {
      newErrors.salaryRange = `Salary Range must be 50 characters or less (currently ${salaryRange.length}).`;
    } else if (!isValidSalaryRange(salaryRange)) {
      newErrors.salaryRange = 'Salary Range must follow a valid format (e.g., 100K, 80k-100k, 80000, or £80/hr). Multiple K characters or additional letters are not allowed.';
    }

    if (jobDescription.length > 5000) {
      newErrors.jobDescription = `Job Description must be 5000 characters or less (currently ${jobDescription.length}).`;
    }

    if (notes.length > 1000) {
      newErrors.notes = `Notes must be 1000 characters or less (currently ${notes.length}).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      id: initialData?.id,
      company_name: companyName.trim(),
      job_title: jobTitle.trim(),
      salary_range: salaryRange.trim(),
      location: location.trim() || 'Remote',
      job_description: jobDescription.trim(),
      notes: notes.trim(),
      application_status: status
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        id="application-form-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5">
          <div>
            <h2 className="font-sans text-lg font-bold text-slate-900 uppercase tracking-wide">
              {initialData ? 'Edit Job Application' : 'Add New Job Application'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialData ? 'Update status, interview notes and company metrics.' : 'Track a new opportunity in your job hunt pipeline.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            id="form-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Company Name *</span>
                </span>
                <span className={`text-[10px] ${companyName.length > 100 ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-400'}`}>
                  {companyName.length}/100
                </span>
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={companyName}
                onChange={(e) => handleCompanyChange(e.target.value)}
                placeholder="Google, Stripe, Supabase..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.companyName 
                    ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500 text-rose-900' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                id="form-company"
              />
              {errors.companyName && (
                <p className="mt-1 flex items-center space-x-1 text-xs text-rose-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.companyName}</span>
                </p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>Job Title *</span>
                </span>
                <span className={`text-[10px] ${jobTitle.length > 100 ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-400'}`}>
                  {jobTitle.length}/100
                </span>
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={jobTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Senior Full Stack Engineer..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.jobTitle 
                    ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500 text-rose-900' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                id="form-title"
              />
              {errors.jobTitle && (
                <p className="mt-1 flex items-center space-x-1 text-xs text-rose-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.jobTitle}</span>
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>Location</span>
                </span>
                <span className={`text-[10px] ${location.length > 100 ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-400'}`}>
                  {location.length}/100
                </span>
              </label>
              <input
                type="text"
                maxLength={120}
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="Remote, San Francisco, Hybrid..."
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.location 
                    ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500 text-rose-900' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                id="form-location"
              />
              {errors.location && (
                <p className="mt-1 flex items-center space-x-1 text-xs text-rose-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.location}</span>
                </p>
              )}
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between" htmlFor="form-salary">
                <span className="flex items-center space-x-1">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  <span>Salary Range (CAD)</span>
                </span>
                <span className={`text-[10px] ${salaryRange.length > 50 ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-400'}`}>
                  {salaryRange.length}/50
                </span>
              </label>
              <input
                type="text"
                maxLength={60}
                value={salaryRange}
                onChange={(e) => handleSalaryChange(e.target.value)}
                placeholder="e.g. 120k - 150k, 80000"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.salaryRange 
                    ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500 text-rose-900' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                id="form-salary"
              />
              {errors.salaryRange && (
                <p className="mt-1 flex items-center space-x-1 text-xs text-rose-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.salaryRange}</span>
                </p>
              )}
            </div>

            {/* Application Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Application Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="form-status"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Description (with Local Parser Card) */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Job Description / Requirement Text</span>
              </span>
              <span className={`text-[10px] ${jobDescription.length > 5000 ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-400'}`}>
                {jobDescription.length}/5000
              </span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Paste job posting text here to extract key location, salary range, job title, and core skills instantly..."
              rows={4}
              maxLength={5500}
              className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-xs focus:outline-none focus:ring-1 ${
                errors.jobDescription 
                  ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500 text-rose-900' 
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              id="form-description"
            />

            {/* Interactive Local Parser Preview */}
            {parsedInfo && (
              <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800">
                    <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                    <span>Local Zero-AI Job Scanner detected parameters:</span>
                  </span>
                  <button
                    type="button"
                    onClick={applyParsedValues}
                    className="flex items-center space-x-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                    id="form-apply-parsed"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Apply Extracted Values</span>
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase">Detected Title</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {parsedInfo.jobTitle || <span className="italic text-slate-400">Not found</span>}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase">Detected Salary</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {parsedInfo.salaryRange || <span className="italic text-gray-400">Not found</span>}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/80 p-2 border border-indigo-50">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase">Detected Location</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {parsedInfo.location || <span className="italic text-slate-400">Not found</span>}
                    </span>
                  </div>
                </div>

                {parsedInfo.detectedSkills.length > 0 && (
                  <div className="mt-2.5">
                    <span className="block font-semibold text-slate-500 text-[10px] uppercase mb-1">Keywords / Skills identified:</span>
                    <div className="flex flex-wrap gap-1">
                      {parsedInfo.detectedSkills.map(skill => (
                        <span key={skill} className="rounded bg-indigo-100/80 px-2 py-0.5 font-mono text-[10px] text-indigo-800 font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {parseNotice && (
              <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                <Check className="h-4 w-4" />
                <span>{parseNotice}</span>
              </div>
            )}
            {errors.jobDescription && (
              <p className="mt-1 flex items-center space-x-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.jobDescription}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Personal Notes & Reminders</span>
              <span className={`text-[10px] ${notes.length > 1000 ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-400'}`}>
                {notes.length}/1000
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Spoke with Hiring Manager... Prepared list of questions... Next interview scheduled..."
              rows={3}
              maxLength={1100}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.notes 
                  ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500 text-rose-900' 
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              id="form-notes"
            />
            {errors.notes && (
              <p className="mt-1 flex items-center space-x-1 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.notes}</span>
              </p>
            )}
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              id="form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              id="form-submit"
            >
              {initialData ? 'Save Changes' : 'Track Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
