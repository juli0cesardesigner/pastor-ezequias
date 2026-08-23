import React from 'react';
import { Check, Package, User, MapPin, CheckCircle2 } from 'lucide-react';
import type { WizardStep } from '../../../hooks/useMaterialOrder';

interface StepProgressBarProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

const STEPS = [
  { id: 1 as WizardStep, label: 'Materiais', icon: Package },
  { id: 2 as WizardStep, label: 'Contato', icon: User },
  { id: 3 as WizardStep, label: 'Endereço', icon: MapPin },
  { id: 4 as WizardStep, label: 'Confirmação', icon: CheckCircle2 }
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  onStepClick
}) => {
  return (
    <nav className="wizard-progress-bar" aria-label="Progresso do formulário">
      {STEPS.map((step) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            type="button"
            className={`wizard-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => isCompleted && onStepClick(step.id)}
            disabled={!isCompleted && !isActive}
            title={step.label}
          >
            <div className="wizard-node-circle">
              {isCompleted ? <Check size={14} className="check-icon" /> : <Icon size={14} />}
            </div>
            <span className="wizard-node-label">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
