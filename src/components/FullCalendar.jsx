import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Download, Plus, X, MapPin } from 'lucide-react';

const FullCalendar = () => {
  const { events, addEvent } = useCommunity();
  const { currentUser } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Submit Event Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Only display approved events
  const approvedEvents = events.filter(e => e.status === 'approved');

  const getEventsForDay = (day) => {
    return approvedEvents.filter(evt => {
      const eDate = new Date(evt.date);
      // Adjust for local time mapping if needed, assuming YYYY-MM-DD
      return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === day;
    });
  };

  const handleDownloadIcs = (evt) => {
    // Generate simple .ics format
    const formatIcsDate = (dateStr, timeStr) => {
      // Very basic parser for mock purposes
      const d = new Date(`${dateStr} ${timeStr.replace('CST','').trim()}`);
      if (isNaN(d.getTime())) return new Date().toISOString().replace(/-|:|\.\d+/g, '');
      return d.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//eXp Syndicate//Onboarding App//EN',
      'BEGIN:VEVENT',
      `UID:${evt.id}@expsyndicate.com`,
      `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}`,
      `DTSTART:${formatIcsDate(evt.date, evt.time)}`,
      `SUMMARY:${evt.title}`,
      `DESCRIPTION:${evt.description || 'No description'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${evt.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (newEventTitle.trim() && newEventDate.trim() && newEventTime.trim()) {
      addEvent(newEventTitle, newEventDate, newEventTime, newEventDesc);
      setIsSubmitting(false);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventDesc('');
      alert("Event submitted for admin approval!");
    }
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Training Calendar</h1>
          <p className="text-muted">Mastermind calls, compliance sessions, and syndicate events.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsSubmitting(true)}>
          <Plus size={18} />
          Suggest Event
        </button>
      </div>

      <div className="card" style={styles.calendarCard}>
        <div style={styles.calendarHeader}>
          <button onClick={handlePrevMonth} style={styles.navBtn}>&larr;</button>
          <h2 style={styles.monthTitle}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={handleNextMonth} style={styles.navBtn}>&rarr;</button>
        </div>

        <div style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={styles.weekDayCell}>{d}</div>
          ))}
        </div>

        <div style={styles.calendarGrid}>
          {blanksArray.map(b => (
            <div key={`blank-${b}`} style={{...styles.dayCell, ...styles.blankCell}}></div>
          ))}
          {daysArray.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            return (
              <div key={day} style={{...styles.dayCell, ...(isToday ? styles.todayCell : {})}}>
                <div style={styles.dayNumber}>{day}</div>
                <div style={styles.eventsWrapper}>
                  {dayEvents.map(evt => (
                    <div 
                      key={evt.id} 
                      style={styles.eventPill} 
                      onClick={() => setSelectedEvent(evt)}
                    >
                      {evt.time.split(' ')[0]} - {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggest Event Modal */}
      {isSubmitting && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <CalendarIcon size={18} /> Suggest New Event
              </h3>
              <button onClick={() => setIsSubmitting(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={{fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem'}}>
                Suggested events will be sent to the admin team for approval before appearing on the public calendar.
              </p>
              <form onSubmit={handleSubmitEvent} style={styles.form}>
                <input type="text" placeholder="Event Title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} style={styles.input} required />
                <div style={{display: 'flex', gap: '1rem'}}>
                  <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} style={styles.input} required />
                  <input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} style={styles.input} required />
                </div>
                <textarea placeholder="Description or meeting link..." value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} style={styles.textArea} rows={4} />
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
                  <button type="button" onClick={() => setIsSubmitting(false)} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" className="btn-primary">Submit Event</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <CalendarIcon size={18} /> Event Details
              </h3>
              <button onClick={() => setSelectedEvent(null)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <h2 style={{marginTop: 0, marginBottom: '0.5rem', color: 'var(--color-dark-navy)'}}>{selectedEvent.title}</h2>
              
              <div style={styles.detailRow}>
                <CalendarIcon size={16} color="var(--color-primary)" />
                <span style={{fontWeight: '500'}}>
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <MapPin size={16} color="var(--color-primary)" />
                <span>{selectedEvent.time}</span>
              </div>
              
              {selectedEvent.description && (
                <div style={styles.eventDesc}>
                  {selectedEvent.description}
                </div>
              )}
              
              <div style={{display: 'flex', justifyContent: 'center', marginTop: '1.5rem'}}>
                <button onClick={() => handleDownloadIcs(selectedEvent)} className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>
                  <Download size={18} />
                  Download to Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  calendarCard: {
    padding: '1.5rem',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  monthTitle: {
    margin: 0,
    fontSize: '1.5rem',
    color: 'var(--color-dark-navy)',
    fontWeight: '600',
  },
  navBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    color: 'var(--color-moss-grey)',
    fontWeight: 'bold',
  },
  weekDays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  weekDayCell: {
    textAlign: 'center',
    fontWeight: '600',
    color: 'var(--color-slate-blue)',
    fontSize: '0.9rem',
    padding: '0.5rem',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.5rem',
    flexGrow: 1,
  },
  dayCell: {
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    minHeight: '100px',
    padding: '0.5rem',
    backgroundColor: 'var(--color-white)',
    display: 'flex',
    flexDirection: 'column',
  },
  blankCell: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    border: '1px dashed var(--color-border)',
  },
  todayCell: {
    borderColor: 'var(--color-primary)',
    backgroundColor: 'rgba(0, 161, 224, 0.05)',
  },
  dayNumber: {
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
  },
  eventsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
    flexGrow: 1,
  },
  eventPill: {
    backgroundColor: 'var(--color-frosted-blue)',
    color: 'var(--color-dark-navy)',
    fontSize: '0.7rem',
    padding: '0.25rem 0.4rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    borderLeft: '3px solid var(--color-primary)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(12, 15, 36, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: 'var(--color-dark-navy)',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none', border: 'none', color: 'white', cursor: 'pointer'
  },
  modalBody: {
    padding: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
  textArea: {
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    fontWeight: '500',
    cursor: 'pointer',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    color: 'var(--color-text-main)',
    fontSize: '0.95rem',
  },
  eventDesc: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1rem',
    fontSize: '0.9rem',
    color: 'var(--color-text-main)',
    lineHeight: 1.5,
  }
};

export default FullCalendar;
