const fs = require('fs');
const content = fs.readFileSync('src/components/FullCalendar.jsx', 'utf8');

const targetStr = `<button 
            className="btn-secondary" 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'List View' : 'Calendar View'}
          </button>`;

const replacementStr = `<div style={{ position: 'relative' }}>
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
          </div>`;

let newContent = content.replace(targetStr, replacementStr);

const viewLogicTargetRegex = /\{viewMode === 'grid' \? \([\s\S]*?\) : \([\s\S]*?\n        <\/div>\n      \)\}/m;

const newViewLogic = `
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
        let headerTitle = '';
        if (viewMode === 'day') {
          headerTitle = start.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
        } else {
          const m1 = daysToShow[0].toLocaleString('default', { month: 'long' });
          const m2 = daysToShow[daysToShow.length - 1].toLocaleString('default', { month: 'long' });
          const y1 = daysToShow[0].getFullYear();
          const y2 = daysToShow[daysToShow.length - 1].getFullYear();
          if (m1 === m2 && y1 === y2) {
            headerTitle = \`\${m1} \${y1}\`;
          } else if (y1 === y2) {
            headerTitle = \`\${m1} - \${m2} \${y1}\`;
          } else {
            headerTitle = \`\${m1} \${y1} - \${m2} \${y2}\`;
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
                <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${daysToShow.length}, 1fr)\`, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${daysToShow.length}, 1fr)\`, flexGrow: 1 }}>
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
                                  border: isBulkMode && isSelected ? \`2px solid \${categoryTheme.color}\` : 'none',
                                  borderLeft: isBulkMode && isSelected ? \`4px solid \${categoryTheme.color}\` : \`3px solid \${categoryTheme.color}\`,
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
          {sortedMonthKeys.filter(k => k === \`\${currentDate.getFullYear()}-\${currentDate.getMonth()}\`).length === 0 && sortedMonthKeys.length > 0 && (
             <p className="text-muted text-center" style={{padding: '2rem'}}>No events for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}. Check other months.</p>
          )}
          {sortedMonthKeys.filter(k => k === \`\${currentDate.getFullYear()}-\${currentDate.getMonth()}\`).map(key => {
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
      )}
`;

newContent = newContent.replace(viewLogicTargetRegex, newViewLogic.trim());

fs.writeFileSync('src/components/FullCalendar.jsx', newContent);
console.log("Replacement completed successfully");
