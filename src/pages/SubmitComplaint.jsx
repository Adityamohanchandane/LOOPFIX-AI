import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Loader2, Zap, AlertTriangle, CheckCircle, Info,
  ChevronDown, Edit2, RefreshCw
} from 'lucide-react';
import { complaintsApi, analysisApi } from '../lib/api.js';
import { useToast } from '../contexts/ToastContext.jsx';
import RecurringAlert from '../components/RecurringAlert.jsx';
import { CATEGORIES, URGENCIES, BUILDINGS, getCategoryEmoji } from '../lib/utils.js';

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', 'Terrace', 'Basement'];

const INITIAL_FORM = {
  description: '',
  building: '',
  floor: '',
  category: '',
  urgency: '',
};

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('form'); // 'form' | 'analyzing' | 'review' | 'submitting' | 'done'
  const [analysis, setAnalysis] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(null);
  const [recurringMatches, setRecurringMatches] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // Handle form field changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }, [errors]);

  // Validate the form
  function validate() {
    const errs = {};
    if (!form.description.trim() || form.description.trim().length < 10) {
      errs.description = 'Please describe the issue (at least 10 characters)';
    }
    if (!form.building) {
      errs.building = 'Please select a building or block';
    }
    return errs;
  }

  // Step 1: Validate and analyze
  async function handleAnalyze(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setStep('analyzing');
    setErrors({});

    try {
      const location = [form.building, form.floor].filter(Boolean).join(', ');
      const result = await analysisApi.analyze({
        description: form.description,
        building: form.building,
        floor: form.floor,
        location,
      });

      setAnalysis(result.analysis);
      setAnalysisSource(result.analysisSource);
      setRecurringMatches(result.recurring?.matches || []);
      setStep('review');
    } catch (err) {
      console.error('Analysis failed:', err);
      // Graceful degradation — move to review with fallback
      setAnalysis({
        title: form.description.slice(0, 80),
        normalized_description: form.description,
        category: form.category || 'Other',
        location: [form.building, form.floor].filter(Boolean).join(', '),
        urgency: form.urgency || 'Medium',
        department: 'General Maintenance',
        next_action: 'Assign to maintenance team',
        confidence: 'low',
        usedFallback: true,
      });
      setAnalysisSource('fallback');
      setStep('review');
      toast.warning('AI analysis unavailable. Manual classification applied.');
    }
  }

  // Update AI field override
  function updateAnalysisField(field, value) {
    setAnalysis(prev => ({ ...prev, [field]: value }));
  }

  // Confirm a recurring match
  function handleConfirmMatch(match) {
    setConfirmedMatches(prev => [...prev.filter(m => m.id !== match.id), match]);
    toast.info('Match confirmed. It will be linked when you submit.');
  }

  // Dismiss a recurring match
  function handleDismissMatch(id) {
    setDismissedIds(prev => new Set([...prev, id]));
  }

  const visibleMatches = recurringMatches.filter(m => !dismissedIds.has(m.id));

  // Step 2: Final submission
  async function handleSubmit() {
    if (submitted) return; // Prevent duplicate submission
    setStep('submitting');
    setSubmitted(true);

    try {
      const location = analysis?.location || [form.building, form.floor].filter(Boolean).join(', ');
      const confirmedMatchIds = confirmedMatches.map(m => m.id);
      const confirmedReason = confirmedMatches.length > 0
        ? confirmedMatches.map(m => m.reason).join('; ')
        : null;

      const payload = {
        description: form.description,
        building: form.building,
        floor: form.floor || null,
        location,
        category: analysis?.category || form.category || 'Other',
        urgency: analysis?.urgency || form.urgency || 'Medium',
        department: analysis?.department || 'General Maintenance',
        ai_title: analysis?.title || null,
        normalized_description: analysis?.normalized_description || form.description,
        next_action: analysis?.next_action || null,
        recurring_match_ids: confirmedMatchIds,
        recurring_reason: confirmedReason,
        raw_ai_response: analysisSource === 'ai' ? analysis : null,
      };

      const result = await complaintsApi.submit(payload);

      if (result.mode === 'demo') {
        toast.info('Complaint saved in demo mode. It will be cleared when the server restarts.');
      } else {
        toast.success('Complaint submitted successfully!');
      }

      setStep('done');
    } catch (err) {
      console.error('Submit failed:', err);
      toast.error(`Submission failed: ${err.message}`);
      setStep('review');
      setSubmitted(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Complaint Submitted!</h1>
          <p className="text-gray-400 mb-2">
            Your maintenance report has been recorded and categorized by LoopFix AI.
          </p>
          {confirmedMatches.length > 0 && (
            <p className="text-orange-400 text-sm mb-2">
              ⚠️ Linked to {confirmedMatches.length} previous complaint{confirmedMatches.length > 1 ? 's' : ''} as a recurring issue.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <button
              onClick={() => { setForm(INITIAL_FORM); setStep('form'); setAnalysis(null); setSubmitted(false); setConfirmedMatches([]); setDismissedIds(new Set()); setRecurringMatches([]); }}
              className="btn-secondary"
            >
              Submit Another
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="ambient-orb w-96 h-96 bg-blue-600/10 top-0 right-0 translate-x-1/3" />
        <div className="ambient-orb w-72 h-72 bg-violet-600/8 bottom-0 left-0 -translate-x-1/3" />
      </div>

      <div className="section-container relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Analysis
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Report a Campus Issue
            </h1>
            <p className="text-gray-400">
              Describe the problem and LoopFix AI will analyze it, categorize it, and check for recurring patterns.
            </p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8" aria-label="Form progress">
            {[
              { key: 'form', label: '1. Describe' },
              { key: 'review', label: '2. Review AI' },
              { key: 'submitting', label: '3. Submit' },
            ].map(({ key, label }, i) => {
              const stepOrder = { form: 0, analyzing: 1, review: 1, submitting: 2, done: 3 };
              const currentOrder = stepOrder[step] ?? 0;
              const isActive = stepOrder[key] === currentOrder;
              const isDone = stepOrder[key] < currentOrder;

              return (
                <div key={key} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' :
                    isDone ? 'bg-green-600/20 text-green-400' :
                    'text-gray-600'
                  }`}>
                    {isDone && <CheckCircle className="w-3 h-3" />}
                    {label}
                  </div>
                  {i < 2 && <div className="w-4 h-px bg-white/10" />}
                </div>
              );
            })}
          </div>

          {/* STEP 1: Form */}
          {(step === 'form' || step === 'analyzing') && (
            <form onSubmit={handleAnalyze} className="glass-card p-6 md:p-8 space-y-5 animate-fade-in" noValidate>
              {/* Description */}
              <div>
                <label htmlFor="description" className="form-label">
                  Issue Description <span className="text-red-400" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className={`form-input resize-none ${errors.description ? 'border-red-500/50 focus:border-red-500' : ''}`}
                  placeholder="Describe the problem in detail. E.g. 'The water pipe in the men's restroom is leaking badly and water is pooling on the floor...'"
                  value={form.description}
                  onChange={handleChange}
                  disabled={step === 'analyzing'}
                  aria-required="true"
                  aria-describedby={errors.description ? 'desc-error' : 'desc-hint'}
                  maxLength={1000}
                />
                {errors.description && (
                  <p id="desc-error" className="text-red-400 text-xs mt-1.5 flex items-center gap-1" role="alert">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.description}
                  </p>
                )}
                <p id="desc-hint" className="text-gray-600 text-xs mt-1">
                  {form.description.length}/1000 characters
                </p>
              </div>

              {/* Building + Floor */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="building" className="form-label">
                    Building / Block <span className="text-red-400" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="building"
                      name="building"
                      className={`form-select pr-10 ${errors.building ? 'border-red-500/50' : ''}`}
                      value={form.building}
                      onChange={handleChange}
                      disabled={step === 'analyzing'}
                      aria-required="true"
                    >
                      <option value="">Select building...</option>
                      {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {errors.building && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
                      <AlertTriangle className="w-3.5 h-3.5" /> {errors.building}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="floor" className="form-label">Floor / Area</label>
                  <div className="relative">
                    <select
                      id="floor"
                      name="floor"
                      className="form-select pr-10"
                      value={form.floor}
                      onChange={handleChange}
                      disabled={step === 'analyzing'}
                    >
                      <option value="">Select floor...</option>
                      {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Category + Urgency (optional — AI will classify) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="form-label">
                    Category <span className="text-gray-600 text-xs font-normal">(optional — AI will classify)</span>
                  </label>
                  <div className="relative">
                    <select id="category" name="category" className="form-select pr-10" value={form.category} onChange={handleChange} disabled={step === 'analyzing'}>
                      <option value="">Let AI decide...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="urgency" className="form-label">
                    Urgency <span className="text-gray-600 text-xs font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <select id="urgency" name="urgency" className="form-select pr-10" value={form.urgency} onChange={handleChange} disabled={step === 'analyzing'}>
                      <option value="">Let AI assess...</option>
                      {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-base"
                disabled={step === 'analyzing'}
              >
                {step === 'analyzing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze with AI
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Review AI analysis */}
          {step === 'review' && analysis && (
            <div className="space-y-5 animate-fade-in">
              {/* AI Source banner */}
              {analysisSource === 'fallback' ? (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20" role="alert">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 text-sm font-medium">Rule-based classification (AI unavailable)</p>
                    <p className="text-yellow-500/70 text-xs mt-0.5">AI analysis was not available. Classification below uses rule-based logic. Please review and correct if needed.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-green-300 text-sm">AI analysis complete — review and edit if needed</p>
                </div>
              )}

              {/* AI Results card */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    AI Analysis Results
                  </h2>
                  <button
                    onClick={() => { setStep('form'); setAnalysis(null); setSubmitted(false); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Edit complaint
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Issue Title
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={analysis.title || ''}
                    onChange={e => updateAnalysisField('title', e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Category
                    </label>
                    <div className="relative">
                      <select
                        className="form-select pr-10"
                        value={analysis.category || 'Other'}
                        onChange={e => updateAnalysisField('category', e.target.value)}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryEmoji(c)} {c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="form-label flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Urgency
                    </label>
                    <div className="relative">
                      <select
                        className="form-select pr-10"
                        value={analysis.urgency || 'Medium'}
                        onChange={e => updateAnalysisField('urgency', e.target.value)}
                      >
                        {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Department + Next Action */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Assigned Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={analysis.department || ''}
                      onChange={e => updateAnalysisField('department', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={analysis.location || ''}
                      onChange={e => updateAnalysisField('location', e.target.value)}
                    />
                  </div>
                </div>

                {/* Recommended action */}
                {analysis.next_action && (
                  <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg bg-blue-500/8 border border-blue-500/15">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-300 mb-0.5">Recommended Action</p>
                      <p className="text-gray-400 text-sm">{analysis.next_action}</p>
                    </div>
                  </div>
                )}

                {/* Confidence */}
                {analysis.confidence && (
                  <p className="text-gray-600 text-xs">
                    Classification confidence:{' '}
                    <span className={`font-medium ${
                      analysis.confidence === 'high' ? 'text-green-400' :
                      analysis.confidence === 'medium' ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      {analysis.confidence}
                    </span>
                  </p>
                )}
              </div>

              {/* Recurring matches */}
              {visibleMatches.length > 0 && (
                <div className="glass-card p-6">
                  <RecurringAlert
                    matches={visibleMatches}
                    onConfirm={handleConfirmMatch}
                    onDismiss={handleDismissMatch}
                  />
                </div>
              )}

              {visibleMatches.length === 0 && recurringMatches.length === 0 && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-500/8 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-green-300 text-sm">No similar previous complaints found. This appears to be a new issue.</p>
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                className="btn-primary w-full py-3.5 text-base"
                disabled={step === 'submitting' || submitted}
              >
                {step === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Complaint
                    {confirmedMatches.length > 0 && ` (+ ${confirmedMatches.length} linked)`}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
