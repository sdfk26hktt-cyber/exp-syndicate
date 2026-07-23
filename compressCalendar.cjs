const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'FullCalendar.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add viewMode state
content = content.replace(
  /const \[isBulkMode, setIsBulkMode\] = useState\(false\);\n\s*const \[selectedEventIds, setSelectedEventIds\] = useState\(\[\]\);/,
  `const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  const [expandedMonths, setExpandedMonths] = useState({
    [\`\${currentDate.getFullYear()}-\${currentDate.getMonth()}\`]: true
  });
  
  const toggleMonth = (key) => {
    setExpandedMonths(prev => ({...prev, [key]: !prev[key]}));
  };
  
  const groupedEvents = approvedEvents.reduce((acc, evt) => {
    if (!evt.date || !evt.date.includes('-')) return acc;
    const [y, m, d] = evt.date.split('-');
    const key = \`\${y}-\${parseInt(m, 10) - 1}\`; // match Date getMonth()
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
  `
);

// 2. Add toggle button
content = content.replace(
  /\{!isBulkMode && \(\n\s*<button className="btn-primary" onClick=\{openSuggestModal\}>\n\s*<Plus size=\{18\} \/>\n\s*Suggest Event\n\s*<\/button>\n\s*\)\}/,
  `{!isBulkMode && (
            <button className="btn-primary" onClick={openSuggestModal}>
              <Plus size={18} />
              Suggest Event
            </button>
          )}
          <button 
            className="btn-secondary" 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'List View' : 'Calendar View'}
          </button>`
);

// 3. Conditional render for grid vs list
content = content.replace(
  /<div className="card" style=\{styles\.calendarCard\}>\n\s*<div style=\{styles\.calendarHeader\}>\n\s*<button onClick=\{handlePrevMonth\} style=\{styles\.navBtn\}>&larr;<\/button>\n\s*<h2 style=\{styles\.monthTitle\}>\n\s*\{currentDate\.toLocaleString\('default', \{ month: 'long', year: 'numeric' \}\)\}\n\s*<\/h2>\n\s*<button onClick=\{handleNextMonth\} style=\{styles\.navBtn\}>&rarr;<\/button>\n\s*<\/div>\n\s*<div style=\{\{ overflowX: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column' \}\}>\n\s*<div style=\{\{ minWidth: '800px', flexGrow: 1, display: 'flex', flexDirection: 'column' \}\}>\n\s*<div style=\{styles\.weekDays\}>[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>/,
  `{viewMode === 'grid' ? (
        <div className="card" style={styles.calendarCard}>
          <div style={styles.calendarHeader}>
            <button onClick={handlePrevMonth} style={styles.navBtn}>&larr;</button>
            <h2 style={styles.monthTitle}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={handleNextMonth} style={styles.navBtn}>&rarr;</button>
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
                  <div key={\`blank-\${b}\`} style={{...styles.dayCell, ...styles.blankCell}}></div>
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
                                border: isBulkMode && isSelected ? \`2px solid \${categoryTheme.color}\` : 'none',
                                borderLeft: isBulkMode && isSelected ? \`4px solid \${categoryTheme.color}\` : \`3px solid \${categoryTheme.color}\`,
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
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          {sortedMonthKeys.length === 0 && <p className="text-muted">No upcoming events found.</p>}
          {sortedMonthKeys.map(key => {
            const [y, m] = key.split('-');
            const monthName = new Date(y, m).toLocaleString('default', { month: 'long', year: 'numeric' });
            const monthEvents = groupedEvents[key].sort((a,b) => a.date.localeCompare(b.date));
            const isExpanded = expandedMonths[key];
            
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
                            borderLeft: \`4px solid \${categoryTheme.color}\`
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
                              {evt.date} @ {formatTime(evt.time)} {evt.location ? \`| \${evt.location}\` : ''}
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
      )}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Calendar compressed successfully.');
