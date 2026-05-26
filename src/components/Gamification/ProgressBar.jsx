import React from 'react';

const ProgressBar = ({ progress, label }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>{label}</span>
      </div>
      <div style={styles.track}>
        <div 
          style={{ ...styles.fill, width: `${progress}%` }} 
          className="progress-fill"
        />
      </div>

      <style>{`
        .progress-fill {
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--color-text-main)',
  },
  track: {
    width: '100%',
    height: '10px',
    backgroundColor: 'var(--color-frosted-blue)',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
  },
  fill: {
    height: '100%',
    backgroundColor: 'var(--color-slate-blue)',
    borderRadius: '10px',
    backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
    boxShadow: '0 0 10px rgba(0, 161, 224, 0.5)'
  }
};

export default ProgressBar;
