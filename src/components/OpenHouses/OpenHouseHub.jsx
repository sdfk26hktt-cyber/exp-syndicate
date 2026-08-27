import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Calendar, 
  Clock, 
  Search, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  Layers, 
  ChevronRight,
  ShieldCheck,
  CalendarCheck,
  Building
} from 'lucide-react';
import { useOpenHouse } from '../../context/OpenHouseContext';
import { useAuth } from '../../context/AuthContext';
import { useAgent } from '../../context/AgentContext';

const OpenHouseHub = () => {
  const { 
    listings, 
    bookings, 
    myBookings, 
    checkOverlap, 
    createBooking, 
    syncSisuListings, 
    isSyncing,
    lastSyncedAt 
  } = useOpenHouse();

  const { currentUser } = useAuth();
  const { currentAgentData } = useAgent();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'my-bookings'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListingForBooking, setSelectedListingForBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('15:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Date Quick Presets
  const getUpcomingWeekendDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat

    const thisSat = new Date(today);
    thisSat.setDate(today.getDate() + (6 - dayOfWeek + 7) % 7);

    const thisSun = new Date(thisSat);
    thisSun.setDate(thisSat.getDate() + 1);

    const nextSat = new Date(thisSat);
    nextSat.setDate(thisSat.getDate() + 7);

    const nextSun = new Date(nextSat);
    nextSun.setDate(nextSat.getDate() + 1);

    const formatDateStr = (d) => d.toISOString().split('T')[0];
    const formatDisplay = (d, label) => `${label} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

    return [
      { date: formatDateStr(thisSat), label: formatDisplay(thisSat, 'This Saturday') },
      { date: formatDateStr(thisSun), label: formatDisplay(thisSun, 'This Sunday') },
      { date: formatDateStr(nextSat), label: formatDisplay(nextSat, 'Next Saturday') },
      { date: formatDateStr(nextSun), label: formatDisplay(nextSun, 'Next Sunday') }
    ];
  };

  const weekendPresets = useMemo(() => getUpcomingWeekendDates(), []);

  // Set default date to this Saturday on first open
  const openBookingModal = (listing) => {
    setSelectedListingForBooking(listing);
    setBookingDate(weekendPresets[0]?.date || new Date().toISOString().split('T')[0]);
    setStartTime('13:00');
    setEndTime('15:00');
    setNotes('');
    setSubmitError('');
    setSubmitSuccess(false);
    setIsModalOpen(true);
  };

  // Real-time Overlap Collision Check
  const overlapStatus = useMemo(() => {
    if (!selectedListingForBooking || !bookingDate || !startTime || !endTime) {
      return { hasConflict: false, conflict: null };
    }
    return checkOverlap(selectedListingForBooking.id, bookingDate, startTime, endTime);
  }, [selectedListingForBooking, bookingDate, startTime, endTime, checkOverlap]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (overlapStatus.hasConflict) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await createBooking({
        listingId: selectedListingForBooking.id,
        date: bookingDate,
        startTime,
        endTime,
        notes
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setActiveTab('my-bookings');
      }, 1200);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit open house request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter listings by query
  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const q = searchQuery.toLowerCase();
      const addr = (l.address || '').toLowerCase();
      const agent = (l.listing_agent_name || '').toLowerCase();
      const price = String(l.price || '');
      return addr.includes(q) || agent.includes(q) || price.includes(q);
    });
  }, [listings, searchQuery]);

  // Format 24hr time to 12hr AM/PM
  const formatTimeDisplay = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="open-house-hub animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Hero Stats Card */}
      <div 
        className="card glowing-card mb-6" 
        style={{
          background: 'linear-gradient(135deg, var(--color-dark-navy) 0%, #152c42 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(0, 161, 224, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ 
                backgroundColor: 'rgba(0, 161, 224, 0.2)', 
                color: 'var(--color-primary)', 
                padding: '0.35rem 0.75rem', 
                borderRadius: '999px', 
                fontSize: '0.8rem', 
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Sparkles size={14} /> Syndicate Inventory
              </span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Sisu Synced: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: 'white' }}>
              Open House Scheduling & Coordination
            </h1>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', maxWidth: '600px' }}>
              Book an open house on active team listings. Once approved by the coordinator, the event is automatically synced to Follow Up Boss with seller notifications.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(10px)', 
              padding: '1rem 1.25rem', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              minWidth: '110px'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>{listings.length}</div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.05em' }}>Active Listings</div>
            </div>

            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(10px)', 
              padding: '1rem 1.25rem', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              minWidth: '110px'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>
                {myBookings.filter(b => b.status === 'approved').length}
              </div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.05em' }}>My Approved</div>
            </div>

            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(10px)', 
              padding: '1rem 1.25rem', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              minWidth: '110px'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
                {myBookings.filter(b => b.status === 'pending').length}
              </div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.05em' }}>My Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--color-surface)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('listings')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'listings' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'listings' ? 'white' : 'var(--color-text-main)',
              transition: 'all 0.2s ease'
            }}
          >
            <Building size={16} /> Active Listings ({listings.length})
          </button>

          <button
            onClick={() => setActiveTab('my-bookings')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'my-bookings' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'my-bookings' ? 'white' : 'var(--color-text-main)',
              transition: 'all 0.2s ease'
            }}
          >
            <CalendarCheck size={16} /> My Bookings ({myBookings.length})
          </button>
        </div>

        {activeTab === 'listings' && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexGrow: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search by address, agent, or price..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem 0.6rem 2.4rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <button
              onClick={() => syncSisuListings()}
              disabled={isSyncing}
              title="Refresh inventory from Sisu"
              style={{
                padding: '0.6rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Active Listings Grid */}
      {activeTab === 'listings' && (
        <div>
          {filteredListings.length === 0 ? (
            <div className="card text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
              <Building size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <h3>No listings found matching your search.</h3>
              <p>Try clearing your search query or refreshing from Sisu.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {filteredListings.map(listing => {
                // Find all existing bookings on this listing
                const listingBookings = bookings.filter(b => b.listing_id === listing.id && b.status !== 'rejected');
                const nextBooking = listingBookings[0];

                return (
                  <div 
                    key={listing.id} 
                    className="card listing-card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Listing Image */}
                    <div style={{ position: 'relative', height: '180px', width: '100%', backgroundColor: '#1a202c' }}>
                      <img 
                        src={listing.cover_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'} 
                        alt={listing.address}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: 'white',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}>
                        {listing.sisu_listing_id || 'ACTIVE'}
                      </div>

                      <div style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        right: '0.75rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '1.1rem',
                        fontWeight: 800
                      }}>
                        {listing.price_formatted || `$${Number(listing.price || 0).toLocaleString()}`}
                      </div>
                    </div>

                    {/* Listing Content */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <MapPin size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '3px' }} />
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark-navy)', lineHeight: 1.3 }}>
                          {listing.address}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                        <span>🛏️ {listing.bedrooms || 3} Beds</span>
                        <span>🛁 {listing.bathrooms || 2} Baths</span>
                        <span>📐 {listing.sqft ? `${listing.sqft.toLocaleString()} sqft` : 'N/A'}</span>
                      </div>

                      <div style={{
                        backgroundColor: 'rgba(0, 161, 224, 0.05)',
                        border: '1px solid rgba(0, 161, 224, 0.15)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.8rem',
                        marginBottom: '1rem',
                        color: 'var(--color-text-main)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Listing Agent:</span>
                          <span style={{ fontWeight: 600 }}>{listing.listing_agent_name || 'Syndicate Team'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Seller Contact:</span>
                          <span style={{ fontWeight: 600 }}>{listing.seller_contact_name || 'On File'}</span>
                        </div>
                      </div>

                      {/* Current Bookings / Schedule Status */}
                      {nextBooking ? (
                        <div style={{ 
                          marginBottom: '1rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          backgroundColor: nextBooking.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          border: `1px solid ${nextBooking.status === 'approved' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                          color: nextBooking.status === 'approved' ? '#065f46' : '#92400e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <Clock size={14} />
                          <span>
                            {nextBooking.status === 'approved' ? 'Scheduled' : 'Requested'}: {nextBooking.date} ({formatTimeDisplay(nextBooking.start_time)}-{formatTimeDisplay(nextBooking.end_time)}) by {nextBooking.agent_name}
                          </span>
                        </div>
                      ) : (
                        <div style={{
                          marginBottom: '1rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <CheckCircle size={14} /> Available this weekend
                        </div>
                      )}

                      {/* Book Action Button */}
                      <button
                        onClick={() => openBookingModal(listing)}
                        className="btn-primary"
                        style={{
                          width: '100%',
                          marginTop: 'auto',
                          padding: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}
                      >
                        <Plus size={16} /> Book Open House
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Bookings View */}
      {activeTab === 'my-bookings' && (
        <div>
          {myBookings.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)', opacity: 0.5 }} />
              <h3 style={{ marginTop: 0 }}>You haven't requested any open houses yet.</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Browse the active team inventory and schedule your upcoming weekend open houses.
              </p>
              <button onClick={() => setActiveTab('listings')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} /> Browse Active Listings
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myBookings.map(b => {
                const listing = listings.find(l => l.id === b.listing_id);

                return (
                  <div 
                    key={b.id} 
                    className="card"
                    style={{
                      borderLeft: `5px solid ${b.status === 'approved' ? 'var(--color-success)' : b.status === 'rejected' ? 'var(--color-error)' : '#f59e0b'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor: b.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : b.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: b.status === 'approved' ? '#065f46' : b.status === 'rejected' ? '#991b1b' : '#92400e',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            {b.status === 'approved' && <CheckCircle size={12} />}
                            {b.status === 'pending' && <Clock size={12} />}
                            {b.status === 'rejected' && <AlertTriangle size={12} />}
                            {b.status === 'approved' ? 'Approved & Synced' : b.status === 'pending' ? 'Pending Approval' : 'Declined'}
                          </span>

                          {b.fub_event_id && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              backgroundColor: 'rgba(0, 161, 224, 0.1)',
                              color: 'var(--color-primary)',
                              fontWeight: 600
                            }}>
                              FUB Event: #{b.fub_event_id}
                            </span>
                          )}
                        </div>

                        <h3 style={{ margin: '0.25rem 0', fontSize: '1.2rem', color: 'var(--color-dark-navy)' }}>
                          {listing?.address || 'Listing Address'}
                        </h3>
                        
                        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                          <span>📅 <strong>Date:</strong> {b.date}</span>
                          <span>⏰ <strong>Time:</strong> {formatTimeDisplay(b.start_time)} - {formatTimeDisplay(b.end_time)}</span>
                          <span>💰 <strong>Price:</strong> {listing?.price_formatted || 'N/A'}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <div>Requested {new Date(b.requested_at).toLocaleDateString()}</div>
                        {b.reviewed_at && <div>Reviewed {new Date(b.reviewed_at).toLocaleDateString()}</div>}
                      </div>
                    </div>

                    {b.notes && (
                      <div style={{
                        backgroundColor: 'var(--color-background)',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-main)'
                      }}>
                        <strong>My Notes:</strong> {b.notes}
                      </div>
                    )}

                    {b.status === 'rejected' && b.rejection_reason && (
                      <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#991b1b'
                      }}>
                        <strong>Coordinator Note:</strong> {b.rejection_reason}
                      </div>
                    )}

                    {b.status === 'approved' && (
                      <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#065f46',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <span>✅ Follow Up Boss calendar appointment created with seller attached. Confirmation text sent via LinqApp.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Book Open House with Overlap Collision Detection */}
      {isModalOpen && selectedListingForBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div 
            className="card animate-scale-up" 
            style={{
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700 }}>
                  Schedule Open House
                </span>
                <h2 style={{ margin: '0.2rem 0', fontSize: '1.25rem', color: 'var(--color-dark-navy)' }}>
                  {selectedListingForBooking.address}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Price: <strong>{selectedListingForBooking.price_formatted}</strong> | Listing Agent: {selectedListingForBooking.listing_agent_name}
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Date Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-dark-navy)' }}>
                  Select Open House Date
                </label>
                
                {/* Weekend Quick Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {weekendPresets.map(preset => (
                    <button
                      key={preset.date}
                      type="button"
                      onClick={() => setBookingDate(preset.date)}
                      style={{
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: bookingDate === preset.date ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: bookingDate === preset.date ? 'rgba(0, 161, 224, 0.1)' : 'var(--color-surface)',
                        color: bookingDate === preset.date ? 'var(--color-primary)' : 'var(--color-text-main)',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Time Window Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-dark-navy)' }}>
                  Time Window
                </label>

                {/* Common Duration Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {[
                    { label: '11am - 1pm', start: '11:00', end: '13:00' },
                    { label: '12pm - 2pm', start: '12:00', end: '14:00' },
                    { label: '1pm - 3pm', start: '13:00', end: '15:00' },
                    { label: '2pm - 4pm', start: '14:00', end: '16:00' },
                    { label: '12pm - 3pm', start: '12:00', end: '15:00' },
                    { label: '1pm - 4pm', start: '13:00', end: '16:00' }
                  ].map(slot => (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => {
                        setStartTime(slot.start);
                        setEndTime(slot.end);
                      }}
                      style={{
                        padding: '0.45rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: startTime === slot.start && endTime === slot.end ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: startTime === slot.start && endTime === slot.end ? 'rgba(0, 161, 224, 0.1)' : 'var(--color-surface)',
                        color: startTime === slot.start && endTime === slot.end ? 'var(--color-primary)' : 'var(--color-text-main)',
                        cursor: 'pointer'
                      }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Start Time</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>End Time</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* OVERLAP CONFLICT BANNER */}
              {overlapStatus.hasConflict && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  color: '#991b1b',
                  fontSize: '0.85rem'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>⚠️ Time Slot Collision Detected:</strong>
                    <div style={{ marginTop: '0.2rem' }}>
                      {overlapStatus.conflict?.agentName ? (
                        <>
                          <strong>{overlapStatus.conflict.agentName}</strong> has already requested/booked <strong>{formatTimeDisplay(overlapStatus.conflict.startTime)} - {formatTimeDisplay(overlapStatus.conflict.endTime)}</strong> on this listing for {overlapStatus.conflict.date}.
                        </>
                      ) : (
                        overlapStatus.conflict?.reason || 'Proposed time slot overlaps with an existing booking.'
                      )}
                    </div>
                    <div style={{ marginTop: '0.35rem', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      Please select a different time window or date.
                    </div>
                  </div>
                </div>
              )}

              {/* Notes field */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--color-dark-navy)' }}>
                  Marketing Plan / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Placing 10 directionals on Resler, running targeted FB open house ad..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {submitError && (
                <div style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                  color: '#065f46', 
                  padding: '0.75rem', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}>
                  <CheckCircle size={18} /> Request Submitted! Listing coordinator has been notified.
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-main)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={overlapStatus.hasConflict || isSubmitting || submitSuccess}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: overlapStatus.hasConflict || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: overlapStatus.hasConflict ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Open House Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenHouseHub;
