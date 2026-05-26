import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, ExternalLink } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

const TaskRunnerModal = ({ task, phaseId, onClose }) => {
  const { toggleItem, updateTaskStep } = useAgent();
  const [currentStep, setCurrentStep] = useState(task.currentStepIndex || 0);

  // If task doesn't have steps, we just show a generic finish screen.
  const steps = task.steps || [
    { title: "Task Details", instruction: task.details }
  ];

  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateTaskStep(phaseId, task.id, nextStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateTaskStep(phaseId, task.id, prevStep);
    }
  };

  const handleComplete = () => {
    // If not already completed, toggle it
    if (!task.completed) {
      toggleItem(phaseId, task.id);
    }
    onClose();
  };

  const stepData = steps[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div style={styles.overlay}>
      <div className="animate-fade-in" style={styles.modal}>
        
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.preTitle}>Interactive Guide</div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-dark-navy)' }}>{task.text}</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progressPercent}%`}}></div>
        </div>

        {/* Content Area */}
        <div style={styles.content}>
          <div style={styles.stepIndicator}>
            Step {currentStep + 1} of {steps.length}
          </div>
          <h3 className="text-2xl font-bold mb-4">{stepData.title}</h3>
          
          <div style={styles.instructionCard}>
            <p className="text-lg leading-relaxed">{stepData.instruction}</p>
            
            {stepData.link && (
              <a href={stepData.link} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem', backgroundColor: 'var(--color-dark-navy)' }}>
                Open Link <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button 
            className="btn-secondary" 
            onClick={handlePrev} 
            disabled={currentStep === 0}
            style={{ opacity: currentStep === 0 ? 0 : 1 }}
          >
            <ChevronLeft size={20} /> Back
          </button>

          {isLastStep ? (
            <button className="btn-primary" onClick={handleComplete} style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
              <CheckCircle size={20} />
              {task.completed ? 'Close Task' : `Complete Task (+${task.xp} XP)`}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleNext}>
              Next Step <ChevronRight size={20} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  },
  modal: {
    backgroundColor: 'var(--color-card-bg)',
    width: '100%',
    maxWidth: '800px',
    height: '80vh',
    maxHeight: '700px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden'
  },
  header: {
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--color-border)',
  },
  preTitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--color-primary)',
    fontWeight: '700',
    marginBottom: '0.5rem'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-moss-grey)',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  progressContainer: {
    width: '100%',
    height: '4px',
    backgroundColor: 'var(--color-border)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
    transition: 'width 0.3s ease-out'
  },
  content: {
    flexGrow: 1,
    padding: '3rem 2rem',
    overflowY: 'auto',
    backgroundColor: 'rgba(80, 108, 170, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  stepIndicator: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--color-slate-blue)',
    marginBottom: '1rem',
    display: 'inline-block',
    backgroundColor: 'rgba(80, 108, 170, 0.1)',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    alignSelf: 'flex-start'
  },
  instructionCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  footer: {
    padding: '1.5rem 2rem',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-background)'
  }
};

export default TaskRunnerModal;
