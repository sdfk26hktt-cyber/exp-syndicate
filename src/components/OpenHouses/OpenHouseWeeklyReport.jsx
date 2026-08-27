import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Home, 
  User, 
  Phone, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Share2,
  FileText
} from 'lucide-react';
import { useOpenHouse } from '../../context/OpenHouseContext';

const OpenHouseWeeklyReport = ({ onClose }) => {
  const { listings, bookings, weeklyReportConfig, sendWeeklyReportPrompt } = useOpenHouse();

  // Helper to calculate start and end of week (Monday to Sunday)
  const getWeekRange = (offsetWeeks = 0) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + (offsetWeeks * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const [weekOffset, setWeekOffset] = useState(0); // 0 = Current Week, 1 = Next Week, -1 = Last Week

  const currentRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const formatDateRange = (d1, d2) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${d1.toLocaleDateString('en-US', options)} – ${d2.toLocaleDateString('en-US', options)}`;
  };

  // Filter bookings within the selected week range
  const weekBookings = useMemo(() => {
    const monStr = currentRange.monday.toISOString().split('T')[0];
    const sunStr = currentRange.sunday.toISOString().split('T')[0];

    return bookings.filter(b => {
      return b.date >= monStr && b.date <= sunStr;
    }).sort((a, b) => {
      // Sort by date, then start_time
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_time.localeCompare(b.start_time);
    });
  }, [bookings, currentRange]);

  // Group bookings by Day of Week
  const groupedBookings = useMemo(() => {
    const groups = {};
    weekBookings.forEach(b => {
      const dateObj = new Date(b.date + 'T12:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!groups[dayName]) groups[dayName] = [];
      groups[dayName].push(b);
    });
    return groups;
  }, [weekBookings]);

  // Format time
  const formatTimeDisplay = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Date', 'Time Window', 'Listing Address', 'Price', 'Hosting Agent', 'Agent Phone', 'Sisu Listing Agent', 'Seller Contact', 'Status', 'FUB Event ID', 'Notes'];
    const rows = weekBookings.map(b => {
      const listing = listings.find(l => l.id === b.listing_id);
      return [
        b.date,
        `"${formatTimeDisplay(b.start_time)} - ${formatTimeDisplay(b.end_time)}"`,
        `"${listing?.address || ''}"`,
        `"${listing?.price_formatted || ''}"`,
        `"${b.agent_name}"`,
        `"${b.agent_phone || ''}"`,
        `"${listing?.listing_agent_name || ''}"`,
        `"${listing?.seller_contact_name || ''}"`,
        b.status.toUpperCase(),
        b.fub_event_id || 'N/A',
        `"${(b.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eXp_Syndicate_Open_Houses_${currentRange.monday.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  const approvedCount = weekBookings.filter(b => b.status === 'approved').length;
  const pendingCount = weekBookings.filter(b => b.status === 'pending').length;

  return (
    <div className="weekly-open-house-report" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Action Header - Hidden during print */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onClose && (
            <button 
              onClick={onClose}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              ← Back to Community
            </button>
          )}
          <h2 style={{ margin: 0, color: 'var(--color-dark-navy)', fontSize: '1.5rem', fontWeight: 800 }}>
            Weekly Open House Report
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleExportCsv}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Download size={15} /> Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary"
            style={{
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Week Selector Bar - Hidden during print */}
      <div className="card no-print mb-6" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--color-text-main)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-dark-navy)', minWidth: '220px', textAlign: 'center' }}>
            {formatDateRange(currentRange.monday, currentRange.sunday)}
          </span>
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--color-text-main)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: weekOffset === 0 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              backgroundColor: weekOffset === 0 ? 'rgba(0, 161, 224, 0.1)' : 'transparent',
              color: weekOffset === 0 ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Current Week
          </button>
          <button
            onClick={() => setWeekOffset(1)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              border: weekOffset === 1 ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              backgroundColor: weekOffset === 1 ? 'rgba(0, 161, 224, 0.1)' : 'transparent',
              color: weekOffset === 1 ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Next Weekend
          </button>
        </div>
      </div>

      {/* Printable Report Document */}
      <div 
        className="card print-document" 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Report Header */}
        <div style={{ borderBottom: '2px solid var(--color-dark-navy)', paddingBottom: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <img src="/long-syndicate.png" alt="eXp Syndicate" style={{ height: '32px', width: 'auto' }} />
            </div>
            <h1 style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-dark-navy)' }}>
              Weekly Open House Master Schedule
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Week of: <strong>{formatDateRange(currentRange.monday, currentRange.sunday)}</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <div>Coordinator: <strong>{weeklyReportConfig.coordinator_name || 'Listing Coordinator'}</strong></div>
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div style={{ marginTop: '0.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {approvedCount} Approved • {pendingCount} Pending
            </div>
          </div>
        </div>

        {/* Empty State */}
        {weekBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No Open Houses Scheduled For This Week</h3>
            <p style={{ margin: 0 }}>Agents have not scheduled open houses within this date range yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Object.entries(groupedBookings).map(([dayTitle, dayBookings]) => (
              <div key={dayTitle}>
                <div style={{ 
                  backgroundColor: 'var(--color-dark-navy)', 
                  color: 'white', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '6px', 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>📅 {dayTitle}</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{dayBookings.length} {dayBookings.length === 1 ? 'Open House' : 'Open Houses'}</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Time</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Listing Address</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Price</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Hosting Agent</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Listing Agent / Seller</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayBookings.map(b => {
                        const listing = listings.find(l => l.id === b.listing_id);
                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--color-primary)' }}>
                              {formatTimeDisplay(b.start_time)} - {formatTimeDisplay(b.end_time)}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-dark-navy)' }}>
                                {listing?.address || 'Address on file'}
                              </div>
                              {b.notes && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                  📝 {b.notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                              {listing?.price_formatted || 'N/A'}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: 600 }}>{b.agent_name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{b.agent_phone || b.agent_id}</div>
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.82rem' }}>
                              <div><strong>LA:</strong> {listing?.listing_agent_name || 'Syndicate'}</div>
                              <div style={{ color: 'var(--color-text-muted)' }}><strong>Seller:</strong> {listing?.seller_contact_name || 'On file'}</div>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '0.25rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                backgroundColor: b.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : b.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: b.status === 'approved' ? '#065f46' : b.status === 'pending' ? '#92400e' : '#991b1b'
                              }}>
                                {b.status}
                              </span>
                              {b.fub_event_id && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                                  FUB #{b.fub_event_id}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Footer */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>eXp Syndicate Team • Internal Listing & Open House Coordination</div>
          <div>All open houses synced with Follow Up Boss & Sisu APIs</div>
        </div>
      </div>
    </div>
  );
};

export default OpenHouseWeeklyReport;
