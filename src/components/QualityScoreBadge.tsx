import React, { useState } from 'react';
import { QualityAudit } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, Sparkles, Copy, Check } from 'lucide-react';

interface Props {
  audit?: QualityAudit;
  compact?: boolean;
  onAutoFixDuplicates?: () => void;
}

export const QualityScoreBadge: React.FC<Props> = ({ audit, compact = false, onAutoFixDuplicates }) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedAudit, setCopiedAudit] = useState(false);

  if (!audit) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        Not Audited
      </span>
    );
  }

  const { overallScore, status, titleScore, descriptionScore, keywordScore, keywordCount, duplicates, metrics } = audit;

  const getTheme = (score: number) => {
    if (score >= 85) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ring: 'text-emerald-600',
        bar: 'bg-emerald-500',
        icon: CheckCircle2,
        label: 'Stock Ready'
      };
    }
    if (score >= 70) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        ring: 'text-amber-600',
        bar: 'bg-amber-500',
        label: 'Needs Polish'
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      ring: 'text-rose-600',
      bar: 'bg-rose-500',
      label: 'Needs Attention'
    };
  };

  const theme = getTheme(overallScore);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${theme.bg}`}>
        <span className="font-semibold">{overallScore}/100</span>
        <span className="text-[10px] opacity-80">({status})</span>
      </div>
    );
  }

  const copyAuditSummary = () => {
    const text = `Quality Audit: ${overallScore}/100 (${status})\nTitle Score: ${titleScore}/100\nDescription Score: ${descriptionScore}/100\nKeyword Score: ${keywordScore}/100 (${keywordCount} keywords)\nDuplicates: ${duplicates.length ? duplicates.join(', ') : 'None'}`;
    navigator.clipboard.writeText(text);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  return (
    <div id="quality-score-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 transition-all">
      {/* Header with Circular Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-base shadow-inner">
            <span>{overallScore}</span>
            <span className="text-[10px] text-slate-400 absolute bottom-1 font-normal">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Metadata Quality Score</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${theme.bg}`}>
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic rule-based stock acceptance check
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAuditSummary}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Copy audit report"
          >
            {copiedAudit ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition"
          >
            {expanded ? 'Hide Details' : 'View Audit'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
        <div>
          <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
            <span>Title</span>
            <span>{titleScore}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${titleScore >= 80 ? 'bg-emerald-500' : titleScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${titleScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
            <span>Description</span>
            <span>{descriptionScore}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${descriptionScore >= 80 ? 'bg-emerald-500' : descriptionScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${descriptionScore}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
            <span>Keywords ({keywordCount})</span>
            <span>{keywordScore}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${keywordScore >= 80 ? 'bg-emerald-500' : keywordScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${keywordScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Duplicate Warning & Auto-Fix Banner */}
      {duplicates.length > 0 && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{duplicates.length} duplicate keyword(s) found:</strong> {duplicates.slice(0, 3).join(', ')}
              {duplicates.length > 3 ? '...' : ''}
            </span>
          </div>
          {onAutoFixDuplicates && (
            <button
              type="button"
              onClick={onAutoFixDuplicates}
              className="text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-2 py-1 rounded transition"
            >
              Remove Duplicates
            </button>
          )}
        </div>
      )}

      {/* Expanded Breakdown Checklist */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Compliance Breakdown</h5>
          <div className="space-y-1.5">
            {metrics.map((m, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                {m.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    <span className={`text-[11px] font-medium ${m.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {m.score}/100
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{m.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
