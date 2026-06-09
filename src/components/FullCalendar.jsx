import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Download, Plus, X, MapPin, CheckSquare, Square, ChevronDown } from 'lucide-react';
import LocationAutocomplete from './LocationAutocomplete';

const CATEGORIES = {
  'Sales Meeting': { color: 'var(--color-primary)', bg: 'rgba(37, 99, 235, 0.1)' },
  'Role Play': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  'Contract Info': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  'Outside Event': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  'Fun Event': { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  'general': { color: 'var(--color-slate-blue)', bg: 'var(--color-frosted-blue)' }
};

const FullCalendar = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useCommunity();
  const { currentUser } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Single Event Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventEndTime, setNewEventEndTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Sales Meeting');

  // Bulk Download State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  
  const [expandedMonths, setExpandedMonths] = useState({
    [`${currentDate.getFullYear()}-${currentDate.getMonth()}`]: true
  });
  
  const toggleMonth = (key) => {
    setExpandedMonths(prev => ({...prev, [key]: !prev[key]}));
  };
  
  // Only display approved events
  const approvedEvents = events.filter(e => e.status === 'approved');

  const groupedEvents = approvedEvents.reduce((acc, evt) => {
    if (!evt.date || !evt.date.includes('-')) return acc;
    const [y, m, d] = evt.date.split('-');
    const key = `${y}-${parseInt(m, 10) - 1}`; // match Date getMonth()
    if (!acc[key]) acc[key] = [];
    acc[key].push(evt);
    return acc;
  }, {});
  
  // Sort keys desc
  const sortedMonthKeys = Object.keys(groupedEvents).sort((a, b) => {
    const [yA, mA] = a.split('-');
    const [yB, mB] = b.split('-');
    if (yA !== yB) return parseInt(yB) - parseInt(yA);
    return parseInt(mB) - parseInt(mA);
  });
  

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${mStr}${ampm}`;
  };

  const getEventsForDay = (day) => {
    const dayEvts = approvedEvents.filter(evt => {
      if (!evt.date || !evt.date.includes('-')) return false;
      const [y, m, d] = evt.date.split('-');
      const eDate = new Date(y, m - 1, d);
      return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === day;
    });
    return dayEvts.sort((a, b) => a.time.localeCompare(b.time));
  };

  const getEventsForDateObj = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const d = dateObj.getDate();
    const dayEvts = approvedEvents.filter(evt => {
      if (!evt.date || !evt.date.includes('-')) return false;
      const [evY, evM, evD] = evt.date.split('-');
      const eDate = new Date(evY, evM - 1, evD);
      return eDate.getFullYear() === y && eDate.getMonth() === m && eDate.getDate() === d;
    });
    return dayEvts.sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleDownloadIcs = (eventsToDownload) => {
    const evts = Array.isArray(eventsToDownload) ? eventsToDownload : [eventsToDownload];
    if (evts.length === 0) return;

    const formatIcsDate = (dateStr, timeStr) => {
      const d = new Date(`${dateStr} ${timeStr.replace('CST','').trim()}`);
      if (isNaN(d.getTime())) return new Date().toISOString().replace(/-|:|\.\d+/g, '');
      return d.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const vEvents = evts.map(evt => {
      return [
        'BEGIN:VEVENT',
        `UID:${evt.id}@expsyndicate.com`,
        `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}`,
        `DTSTART:${formatIcsDate(evt.date, evt.time)}`,
        evt.end_time || evt.endTime ? `DTEND:${formatIcsDate(evt.date, evt.end_time || evt.endTime)}` : null,
        `SUMMARY:${evt.title}`,
        evt.location ? `LOCATION:${evt.location}` : null,
        `DESCRIPTION:${evt.description || 'No description'}`,
        'END:VEVENT'
      ].filter(Boolean).join('\n');
    }).join('\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//eXp Syndicate//Onboarding App//EN',
      vEvents,
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', evts.length > 1 ? 'bulk_events.ics' : `${evts[0].title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (isBulkMode) {
      setIsBulkMode(false);
      setSelectedEventIds([]);
    }
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (newEventTitle.trim() && newEventDate.trim() && newEventTime.trim()) {
      if (editingEventId) {
        await updateEvent(editingEventId, {
          title: newEventTitle,
          date: newEventDate,
          time: newEventTime,
          endTime: newEventEndTime,
          location: newEventLocation,
          description: newEventDesc,
          category: newEventCategory
        });
        alert("Event updated successfully!");
      } else {
        await addEvent(newEventTitle, newEventDate, newEventTime, newEventEndTime, newEventLocation, newEventDesc, newEventCategory);
        alert("Event submitted for admin approval!");
      }
      setIsSubmitting(false);
      setEditingEventId(null);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventEndTime('');
      setNewEventLocation('');
      setNewEventDesc('');
      setNewEventCategory('Sales Meeting');
    }
  };

  const handleEventClick = (evt) => {
    if (isBulkMode) {
      setSelectedEventIds(prev => 
        prev.includes(evt.id) ? prev.filter(id => id !== evt.id) : [...prev, evt.id]
      );
    } else {
      setSelectedEvent(evt);
    }
  };

  const handleEditClick = (evt) => {
    setNewEventTitle(evt.title);
    setNewEventDate(evt.date);
    setNewEventTime(evt.time);
    setNewEventEndTime(evt.end_time || evt.endTime || '');
    setNewEventLocation(evt.location || '');
    setNewEventDesc(evt.description || '');
    setNewEventCategory(evt.type || 'Sales Meeting');
    setEditingEventId(evt.id);
    setSelectedEvent(null);
    setIsSubmitting(true);
  };

  const handleDeleteClick = async (evt) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(evt.id);
      setSelectedEvent(null);
    }
  };

  const openSuggestModal = () => {
    setEditingEventId(null);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventEndTime('');
    setNewEventLocation('');
    setNewEventDesc('');
    setNewEventCategory('Sales Meeting');
    setIsSubmitting(true);
  };

  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month' || viewMode === 'schedule') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === '3day') {
      newDate.setDate(newDate.getDate() - 3);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month' || viewMode === 'schedule') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === '3day') {
      newDate.setDate(newDate.getDate() + 3);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
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
        <div style={{display: 'flex', gap: '1rem'}}>
          <button 
            className={isBulkMode ? "btn-secondary" : "btn-primary"} 
            style={isBulkMode ? {backgroundColor: 'var(--color-background-alt)'} : {backgroundColor: 'var(--color-dark-navy)'}}
            onClick={() => {
              setIsBulkMode(!isBulkMode);
              if (isBulkMode) setSelectedEventIds([]);
            }}
          >
            {isBulkMode ? <X size={18} /> : <CheckSquare size={18} />}
            {isBulkMode ? "Cancel Bulk Select" : "Select Multiple"}
          </button>
          {!isBulkMode && (
            <button className="btn-primary" onClick={openSuggestModal}>
              <Plus size={18} />
              Suggest Event
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px', justifyContent: 'space-between' }}
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
            >
              {viewMode === 'schedule' && 'Schedule'}
              {viewMode === 'day' && 'Day'}
              {viewMode === '3day' && '3 Day'}
              {viewMode === 'week' && 'Week'}
              {viewMode === 'month' && 'Month'}
              <ChevronDown size={16} />
            </button>
            {isViewDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 50,
                minWidth: '150px',
                overflow: 'hidden',
                border: '1px solid var(--color-border)'
              }}>
                {['schedule', 'day', '3day', 'week', 'month'].map(mode => (
                  <div 
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      setIsViewDropdownOpen(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: viewMode === mode ? 'var(--color-bg-secondary)' : 'white',
                      fontWeight: viewMode === mode ? 'bold' : 'normal',
                      color: 'var(--color-dark-navy)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = viewMode === mode ? 'var(--color-bg-secondary)' : 'white'}
                  >
                    <span style={{textTransform: 'capitalize'}}>{mode === '3day' ? '3 Day' : mode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------- MONTH VIEW --------------------- */}
      {viewMode === 'month' && (
        <div className="card" style={styles.calendarCard}>
          <div style={styles.calendarHeader}>
            <button onClick={handlePrevDate} style={styles.navBtn}>&larr;</button>
            <h2 style={styles.monthTitle}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={handleNextDate} style={styles.navBtn}>&rarr;</button>
          </div>

          <div style={{ overflowX: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ minWidth: '800px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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
                        {dayEvents.map(evt => {
                          const isSelected = selectedEventIds.includes(evt.id);
                          const categoryTheme = CATEGORIES[evt.type] || CATEGORIES['general'];
                          return (
                            <div 
                              key={evt.id} 
                              style={{
                                ...styles.eventPill,
                                backgroundColor: categoryTheme.bg,
                                borderLeftColor: categoryTheme.color,
                                border: isBulkMode && isSelected ? `2px solid ${categoryTheme.color}` : 'none',
                                borderLeft: isBulkMode && isSelected ? `4px solid ${categoryTheme.color}` : `3px solid ${categoryTheme.color}`,
                                opacity: isBulkMode && !isSelected ? 0.6 : 1
                              }} 
                              onClick={() => handleEventClick(evt)}
                            >
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{fontWeight: 600, color: categoryTheme.color}}>{formatTime(evt.time)}</span>
                                {isBulkMode && (
                                  isSelected ? <CheckSquare size={12} color={categoryTheme.color} /> : <Square size={12} color="var(--color-moss-grey)" />
                                )}
                              </div>
                              <div style={{color: 'var(--color-dark-navy)', marginTop: '2px'}}>{evt.title}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------- WEEK, 3 DAY, DAY VIEWS --------------------- */}
      {(viewMode === 'week' || viewMode === '3day' || viewMode === 'day') && (() => {
        let daysToShow = [];
        const start = new Date(currentDate);
        if (viewMode === 'week') {
          start.setDate(start.getDate() - start.getDay()); // go to Sunday
          for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            daysToShow.push(d);
          }
        } else if (viewMode === '3day') {
          for (let i = 0; i < 3; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            daysToShow.push(d);
          }
        } else if (viewMode === 'day') {
          daysToShow.push(start);
        }

        // Title format
        let headerTitle;
        if (viewMode === 'day') {
          headerTitle = start.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
        } else {
          const m1 = daysToShow[0].toLocaleString('default', { month: 'long' });
          const m2 = daysToShow[daysToShow.length - 1].toLocaleString('default', { month: 'long' });
          const y1 = daysToShow[0].getFullYear();
          const y2 = daysToShow[daysToShow.length - 1].getFullYear();
          if (m1 === m2 && y1 === y2) {
            headerTitle = `${m1} ${y1}`;
          } else if (y1 === y2) {
            headerTitle = `${m1} - ${m2} ${y1}`;
          } else {
            headerTitle = `${m1} ${y1} - ${m2} ${y2}`;
          }
        }

        return (
          <div className="card" style={styles.calendarCard}>
            <div style={styles.calendarHeader}>
              <button onClick={handlePrevDate} style={styles.navBtn}>&larr;</button>
              <h2 style={styles.monthTitle}>{headerTitle}</h2>
              <button onClick={handleNextDate} style={styles.navBtn}>&rarr;</button>
            </div>

            <div style={{ overflowX: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ minWidth: '600px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${daysToShow.length}, 1fr)`, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
                  {daysToShow.map(d => (
                    <div key={d.toISOString()} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-dark-navy)', borderRight: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        {d.toLocaleString('default', { weekday: 'short' })}
                      </div>
                      <div style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                        {d.getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${daysToShow.length}, 1fr)`, flexGrow: 1 }}>
                  {daysToShow.map(d => {
                    const dayEvents = getEventsForDateObj(d);
                    const isToday = new Date().toDateString() === d.toDateString();
                    return (
                      <div key={d.toISOString()} style={{ ...styles.dayCell, ...(isToday ? styles.todayCell : {}), minHeight: '400px' }}>
                        <div style={styles.eventsWrapper}>
                          {dayEvents.map(evt => {
                            const isSelected = selectedEventIds.includes(evt.id);
                            const categoryTheme = CATEGORIES[evt.type] || CATEGORIES['general'];
                            return (
                              <div 
                                key={evt.id} 
                                style={{
                                  ...styles.eventPill,
                                  backgroundColor: categoryTheme.bg,
                                  borderLeftColor: categoryTheme.color,
                                  border: isBulkMode && isSelected ? `2px solid ${categoryTheme.color}` : 'none',
                                  borderLeft: isBulkMode && isSelected ? `4px solid ${categoryTheme.color}` : `3px solid ${categoryTheme.color}`,
                                  opacity: isBulkMode && !isSelected ? 0.6 : 1,
                                  padding: '0.5rem',
                                  marginBottom: '0.5rem'
                                }} 
                                onClick={() => handleEventClick(evt)}
                              >
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem'}}>
                                  <span style={{fontWeight: 600, color: categoryTheme.color}}>{formatTime(evt.time)}</span>
                                  {isBulkMode && (
                                    isSelected ? <CheckSquare size={12} color={categoryTheme.color} /> : <Square size={12} color="var(--color-moss-grey)" />
                                  )}
                                </div>
                                <div style={{color: 'var(--color-dark-navy)', fontWeight: 500}}>{evt.title}</div>
                                {evt.location && <div style={{fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{evt.location}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* --------------------- SCHEDULE VIEW --------------------- */}
      {viewMode === 'schedule' && (
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{...styles.calendarHeader, marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)'}}>
            <button onClick={handlePrevDate} style={styles.navBtn}>&larr;</button>
            <h2 style={{...styles.monthTitle, margin: 0}}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={handleNextDate} style={styles.navBtn}>&rarr;</button>
          </div>
          {sortedMonthKeys.length === 0 && <p className="text-muted">No upcoming events found.</p>}
          {sortedMonthKeys.filter(k => k === `${currentDate.getFullYear()}-${currentDate.getMonth()}`).length === 0 && sortedMonthKeys.length > 0 && (
             <p className="text-muted text-center" style={{padding: '2rem'}}>No events for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}. Check other months.</p>
          )}
          {sortedMonthKeys.filter(k => k === `${currentDate.getFullYear()}-${currentDate.getMonth()}`).map(key => {
            const [y, m] = key.split('-');
            const monthName = new Date(y, m).toLocaleString('default', { month: 'long', year: 'numeric' });
            const monthEvents = groupedEvents[key].sort((a,b) => a.date.localeCompare(b.date));
            const isExpanded = expandedMonths[key] !== false; // default true for current month
            
            return (
              <div key={key} style={{ marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div 
                  onClick={() => toggleMonth(key)}
                  style={{ 
                    padding: '1rem', 
                    backgroundColor: 'var(--color-bg-secondary)', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    color: 'var(--color-dark-navy)'
                  }}
                >
                  <span>{monthName} ({monthEvents.length})</span>
                  <span>{isExpanded ? '▼' : '▶'}</span>
                </div>
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {monthEvents.map(evt => {
                      const categoryTheme = CATEGORIES[evt.type] || CATEGORIES['general'];
                      const isSelected = selectedEventIds.includes(evt.id);
                      
                      return (
                        <div 
                          key={evt.id}
                          onClick={() => handleEventClick(evt)}
                          style={{
                            padding: '1rem',
                            borderTop: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isBulkMode && isSelected ? categoryTheme.bg : 'white',
                            cursor: 'pointer',
                            borderLeft: `4px solid ${categoryTheme.color}`
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-dark-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {evt.title}
                              <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: categoryTheme.bg, color: categoryTheme.color }}>
                                {evt.type || 'Event'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                              {evt.date} @ {formatTime(evt.time)} {evt.location ? `| ${evt.location}` : ''}
                            </div>
                          </div>
                          
                          {isBulkMode && (
                            isSelected ? <CheckSquare size={20} color={categoryTheme.color} /> : <Square size={20} color="var(--color-moss-grey)" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isBulkMode && selectedEventIds.length > 0 && (
        <div style={styles.bulkActionBar} className="animate-fade-in">
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <CheckSquare size={20} color="white" />
            <span style={{color: 'white', fontWeight: 600}}>{selectedEventIds.length} Events Selected</span>
          </div>
          <div style={{display: 'flex', gap: '1rem'}}>
            <button 
              onClick={() => {
                const evtsToDownload = approvedEvents.filter(e => selectedEventIds.includes(e.id));
                handleDownloadIcs(evtsToDownload);
              }}
              style={{...styles.bulkBtn, backgroundColor: 'white', color: 'var(--color-primary)'}}
            >
              <Download size={16} /> Download Selected
            </button>
            <button 
              onClick={() => {
                setIsBulkMode(false);
                setSelectedEventIds([]);
              }}
              style={{...styles.bulkBtn, backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)'}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Suggest/Edit Event Modal */}
      {isSubmitting && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <CalendarIcon size={18} /> {editingEventId ? 'Edit Event' : 'Suggest New Event'}
              </h3>
              <button onClick={() => { setIsSubmitting(false); setEditingEventId(null); }} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              {!editingEventId && (
                <p style={{fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem'}}>
                  Suggested events will be sent to the admin team for approval before appearing on the public calendar.
                </p>
              )}
              <form onSubmit={handleSubmitEvent} style={styles.form}>
                <input type="text" placeholder="Event Title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} style={styles.input} required />
                
                <div style={{display: 'flex', gap: '1rem'}}>
                  <select 
                    value={newEventCategory} 
                    onChange={(e) => setNewEventCategory(e.target.value)} 
                    style={{...styles.input, flex: 1}}
                    required
                  >
                    {Object.keys(CATEGORIES).filter(c => c !== 'general').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} style={{...styles.input, flex: 1}} required />
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} style={styles.input} required />
                  <input type="time" value={newEventEndTime} onChange={(e) => setNewEventEndTime(e.target.value)} style={styles.input} placeholder="End Time (Opt)" />
                </div>
                
                <LocationAutocomplete 
                  value={newEventLocation} 
                  onChange={setNewEventLocation} 
                  style={styles.input} 
                  placeholder="Location or Link (Optional)" 
                />
                
                <textarea placeholder="Description or meeting link..." value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} style={styles.textArea} rows={4} />
                
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
                  <button type="button" onClick={() => { setIsSubmitting(false); setEditingEventId(null); }} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" className="btn-primary">{editingEventId ? 'Save Changes' : 'Submit Event'}</button>
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
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                <h2 style={{marginTop: 0, marginBottom: 0, color: 'var(--color-dark-navy)'}}>{selectedEvent.title}</h2>
                <span style={{
                  backgroundColor: (CATEGORIES[selectedEvent.type] || CATEGORIES['general']).bg,
                  color: (CATEGORIES[selectedEvent.type] || CATEGORIES['general']).color,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  {selectedEvent.type && selectedEvent.type !== 'general' ? selectedEvent.type : 'Event'}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <CalendarIcon size={16} color="var(--color-primary)" />
                <span style={{fontWeight: '500'}}>
                  {(() => {
                    const [y, m, d] = selectedEvent.date.split('-');
                    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                  })()}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <MapPin size={16} color="var(--color-primary)" />
                <span>{formatTime(selectedEvent.time)} {selectedEvent.endTime && `- ${formatTime(selectedEvent.endTime)}`}</span>
              </div>
              
              {selectedEvent.location && (
                <div style={styles.detailRow}>
                  <MapPin size={16} color="var(--color-primary)" />
                  <span style={{color: 'var(--color-slate-blue)', fontWeight: '500'}}>{selectedEvent.location}</span>
                </div>
              )}
              
              {selectedEvent.description && (
                <div style={styles.eventDesc}>
                  {selectedEvent.description}
                </div>
              )}
              
              <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', width: '100%'}}>
                <button onClick={() => handleDownloadIcs(selectedEvent)} className="btn-primary" style={{flex: 1, justifyContent: 'center'}}>
                  <Download size={18} />
                  Download
                </button>
                {currentUser?.role === 'admin' && (
                  <div style={{display: 'flex', gap: '0.5rem', flex: 1}}>
                    <button onClick={() => handleEditClick(selectedEvent)} className="btn-secondary" style={{flex: 1, justifyContent: 'center'}}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClick(selectedEvent)} className="btn-secondary" style={{flex: 1, justifyContent: 'center', color: 'var(--color-danger)', borderColor: 'var(--color-danger)'}}>
                      Delete
                    </button>
                  </div>
                )}
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
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
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
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
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
    position: 'relative',
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
    fontSize: '0.7rem',
    padding: '0.35rem 0.4rem',
    borderRadius: '4px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  bulkActionBar: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--color-primary)',
    padding: '1rem 2rem',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
    zIndex: 100,
  },
  bulkBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '50px',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
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
