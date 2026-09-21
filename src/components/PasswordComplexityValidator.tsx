import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  validatePasswordComplexity,
  PasswordValidationResult,
} from '../utils/passwordValidator';

interface PasswordComplexityValidatorProps {
  password: string;
  isDirty?: boolean;
  showRequirementsList?: boolean;
  showStrengthBar?: boolean;
  compact?: boolean;
  title?: string;
}

export function PasswordComplexityValidator({
  password,
  isDirty = false,
  showRequirementsList = true,
  showStrengthBar = true,
  compact = false,
  title = 'Password Requirements',
}: PasswordComplexityValidatorProps) {
  const result: PasswordValidationResult = validatePasswordComplexity(password);
  const hasInput = password.length > 0;

  // If no input and not dirty, we still show requirements as unfulfilled hints
  return (
    <div
      id="password-complexity-validator"
      className="space-y-2 mt-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 transition-all text-left"
    >
      {/* Header & Strength Gauge */}
      {showStrengthBar && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-wider text-white/50 flex items-center gap-1">
              {result.isValid ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-white/40" />
              )}
              {title}
            </span>
            <span className={`font-black uppercase tracking-wider ${result.strengthColor}`}>
              {hasInput ? result.strengthLabel : 'Requirements'}
            </span>
          </div>

          {/* 3-segment progress meter */}
          <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
            {[1, 2, 3].map((step) => {
              const isActive = result.score >= step;
              let barColor = 'bg-white/10';
              if (isActive) {
                if (result.score === 1) barColor = 'bg-red-500';
                else if (result.score === 2) barColor = 'bg-amber-500';
                else barColor = 'bg-emerald-500';
              }
              return (
                <div
                  key={step}
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Requirement Items */}
      {showRequirementsList && (
        <div className={`space-y-1.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {result.requirements.map((req) => {
            const isMet = req.met;
            const isFailing = hasInput && !isMet;

            return (
              <div
                key={req.id}
                id={`password-req-${req.id}`}
                className={`flex items-center justify-between py-0.5 px-1 rounded transition-colors ${
                  isMet
                    ? 'text-emerald-400'
                    : isFailing
                    ? 'text-red-400/90'
                    : 'text-white/50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isMet
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isFailing
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                  >
                    {isMet ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : isFailing ? (
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    )}
                  </div>
                  <span className="truncate font-medium">{req.label}</span>
                </div>

                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                    isMet
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : isFailing
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-white/30'
                  }`}
                >
                  {req.hint}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Real-time Status Notice */}
      {hasInput && !result.isValid && (
        <div className="pt-1 border-t border-white/5 text-[10px] text-amber-300/90 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
          <span>
            {result.errors.length === 1
              ? `Missing: ${result.errors[0]}`
              : `Missing ${result.errors.length} requirements`}
          </span>
        </div>
      )}

      {hasInput && result.isValid && (
        <div className="pt-1 border-t border-white/5 text-[10px] text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>All password complexity requirements met</span>
        </div>
      )}
    </div>
  );
}
