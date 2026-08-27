import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Building, 
  ExternalLink, 
  User, 
  Phone, 
  Key, 
  DollarSign, 
  Bed, 
  Bath, 
  Maximize, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Link2
} from 'lucide-react';
import { useOpenHouse } from '../../context/OpenHouseContext';

const ListingEditModal = ({ isOpen, onClose, listing = null, onSaved = null }) => {
  const { updateListing, addListing, deleteListing } = useOpenHouse();

  const isCreating = !listing || !listing.id;

  const [formData, setFormData] = useState({
    id: '',
    address: '',
    price: '',
    price_formatted: '',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    cover_image: '',
    listing_agent_name: 'Brian Burds',
    listing_agent_id: 'brian@brianburds.com',
    seller_contact_name: '',
    seller_contact_id: '',
    seller_phone: '(915) 555-0100',
    fub_deal_id: '',
    fub_link: '',
    stage: 'MLS Live Listings',
    sisu_listing_id: '',
    mls_number: '',
    notes: '',
    status: 'active',
    is_open_house_enabled: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (listing) {
      const sisuId = listing.sisu_listing_id || '';
      const mlsNum = listing.mls_number || (sisuId.startsWith('MLS-') ? sisuId.replace('MLS-', '') : '');
      const sellerId = listing.seller_contact_id ? String(listing.seller_contact_id) : '';
      const fubDealId = listing.fub_deal_id ? String(listing.fub_deal_id) : (listing.id?.startsWith('fub-sisu-') ? listing.id.replace('fub-sisu-', '') : '');
      
      let computedFubLink = listing.fub_link;
      if (!computedFubLink) {
        if (sellerId) computedFubLink = `https://brianburds.followupboss.com/2/people/view/${sellerId}`;
        else if (fubDealId) computedFubLink = `https://brianburds.followupboss.com/2/deals/view/${fubDealId}`;
      }

      setFormData({
        id: listing.id || '',
        address: listing.address || '',
        price: listing.price !== undefined ? listing.price : '',
        price_formatted: listing.price_formatted || '',
        bedrooms: listing.bedrooms || 3,
        bathrooms: listing.bathrooms || 2,
        sqft: listing.sqft || 1800,
        cover_image: listing.cover_image || '',
        listing_agent_name: listing.listing_agent_name || 'Brian Burds',
        listing_agent_id: listing.listing_agent_id || 'brian@brianburds.com',
        seller_contact_name: listing.seller_contact_name || '',
        seller_contact_id: sellerId,
        seller_phone: listing.seller_phone || '',
        fub_deal_id: fubDealId,
        fub_link: computedFubLink || '',
        stage: listing.stage || 'MLS Live Listings',
        sisu_listing_id: sisuId,
        mls_number: mlsNum,
        notes: listing.notes || '',
        status: listing.status || 'active',
        is_open_house_enabled: listing.is_open_house_enabled !== false
      });
    } else {
      setFormData({
        id: '',
        address: '',
        price: '',
        price_formatted: '',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
        cover_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        listing_agent_name: 'Brian Burds',
        listing_agent_id: 'brian@brianburds.com',
        seller_contact_name: '',
        seller_contact_id: '',
        seller_phone: '(915) 555-0100',
        fub_deal_id: '',
        fub_link: '',
        stage: 'MLS Live Listings',
        sisu_listing_id: '',
        mls_number: '',
        notes: '',
        status: 'active',
        is_open_house_enabled: true
      });
    }
    setSaveSuccess(false);
    setErrorMsg('');
  }, [listing, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto compute price_formatted if numerical price changes
      if (name === 'price') {
        const num = Number(String(value).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(num) && num > 0) {
          updated.price_formatted = `$${num.toLocaleString()}`;
        }
      }

      // Auto compute MLS ID from sisu_listing_id
      if (name === 'mls_number' && value && !prev.sisu_listing_id) {
        updated.sisu_listing_id = `MLS-${value.trim()}`;
      }

      // Auto compute FUB Link if seller_contact_id changes
      if (name === 'seller_contact_id' && value.trim()) {
        updated.fub_link = `https://brianburds.followupboss.com/2/people/view/${value.trim()}`;
      } else if (name === 'fub_deal_id' && value.trim() && !updated.seller_contact_id) {
        updated.fub_link = `https://brianburds.followupboss.com/2/deals/view/${value.trim()}`;
      }

      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.address.trim()) {
      setErrorMsg('Please enter a valid property address.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      if (isCreating) {
        await addListing(formData);
      } else {
        await updateListing(listing.id || formData.id, formData);
      }
      setSaveSuccess(true);
      if (onSaved) onSaved(formData);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving listing:', err);
      setErrorMsg(err.message || 'Failed to save listing changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!listing || !listing.id) return;
    if (window.confirm(`Are you sure you want to remove "${formData.address}" from the listings catalog?`)) {
      setIsSaving(true);
      try {
        await deleteListing(listing.id);
        onClose();
      } catch (err) {
        setErrorMsg('Failed to delete listing: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Quick link helpers
  const activeFubUrl = formData.fub_link || 
    (formData.seller_contact_id ? `https://brianburds.followupboss.com/2/people/view/${formData.seller_contact_id}` : 
    (formData.fub_deal_id ? `https://brianburds.followupboss.com/2/deals/view/${formData.fub_deal_id}` : null));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-background, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 161, 224, 0.12)',
              color: 'var(--color-primary, #00a1e0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-dark-navy, #0f172a)' }}>
                {isCreating ? 'Add New Property & CRM Link' : 'Edit Listing & CRM Connections'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {formData.address || 'Configure Follow Up Boss, Sisu, and property details'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {errorMsg && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              color: '#dc2626',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              color: '#059669',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} />
              <span>Listing changes saved & synced to cloud database!</span>
            </div>
          )}

          {/* Section 1: Follow Up Boss (FUB) Connection */}
          <div style={{
            backgroundColor: 'rgba(0, 161, 224, 0.04)',
            border: '1px solid rgba(0, 161, 224, 0.25)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link2 size={18} style={{ color: 'var(--color-primary, #00a1e0)' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-navy, #0f172a)' }}>
                  Follow Up Boss (FUB) Integration Details
                </h4>
              </div>

              {activeFubUrl && (
                <a
                  href={activeFubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-primary, #00a1e0)',
                    backgroundColor: 'rgba(0, 161, 224, 0.1)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={13} /> Open in Follow Up Boss ↗
                </a>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={fieldLabelStyle}>FUB Person / Seller Lead ID</label>
                <input
                  type="text"
                  name="seller_contact_id"
                  value={formData.seller_contact_id}
                  onChange={handleChange}
                  placeholder="e.g. 66792"
                  style={inputStyle}
                />
                <span style={hintStyle}>Maps to FUB contact profile (`/people/view/ID`)</span>
              </div>

              <div>
                <label style={fieldLabelStyle}>FUB Deal / Transaction ID</label>
                <input
                  type="text"
                  name="fub_deal_id"
                  value={formData.fub_deal_id}
                  onChange={handleChange}
                  placeholder="e.g. 4913"
                  style={inputStyle}
                />
                <span style={hintStyle}>Maps to FUB deal in Sisu Sellers pipeline</span>
              </div>

              <div>
                <label style={fieldLabelStyle}>Seller Contact Name</label>
                <input
                  type="text"
                  name="seller_contact_name"
                  value={formData.seller_contact_name}
                  onChange={handleChange}
                  placeholder="e.g. Cody Beaubette"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>Seller Phone Number</label>
                <input
                  type="text"
                  name="seller_phone"
                  value={formData.seller_phone}
                  onChange={handleChange}
                  placeholder="(915) 555-0100"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={fieldLabelStyle}>Direct Follow Up Boss URL (Optional Override)</label>
                <input
                  type="url"
                  name="fub_link"
                  value={formData.fub_link}
                  onChange={handleChange}
                  placeholder="https://brianburds.followupboss.com/2/people/view/..."
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sisu & MLS Connection */}
          <div style={{
            backgroundColor: 'rgba(124, 58, 237, 0.04)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Key size={18} style={{ color: '#7c3aed' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-navy, #0f172a)' }}>
                Sisu & MLS Information
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={fieldLabelStyle}>Sisu Listing ID / Code</label>
                <input
                  type="text"
                  name="sisu_listing_id"
                  value={formData.sisu_listing_id}
                  onChange={handleChange}
                  placeholder="e.g. SISU-6717375 or MLS-950036"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>MLS Number</label>
                <input
                  type="text"
                  name="mls_number"
                  value={formData.mls_number}
                  onChange={handleChange}
                  placeholder="e.g. 950036"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>Pipeline Stage</label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="MLS Live Listings">MLS Live Listings</option>
                  <option value="Signed">Signed</option>
                  <option value="Active Listing">Active Listing</option>
                  <option value="Pending">Pending</option>
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label style={fieldLabelStyle}>Lockbox Serial / Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Lockbox Serial: 2387898"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Property Specs & Photos */}
          <div style={{
            backgroundColor: 'var(--color-background, #f8fafc)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-navy, #0f172a)' }}>
              Property Specifications & Media
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={fieldLabelStyle}>Full Property Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 6360 Dakota Ridge, El Paso, TX 79912"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>List Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="355000"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>Formatted Price Label</label>
                <input
                  type="text"
                  name="price_formatted"
                  value={formData.price_formatted}
                  onChange={handleChange}
                  placeholder="$355,000"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>Bedrooms</label>
                <input
                  type="number"
                  step="1"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>Bathrooms</label>
                <input
                  type="number"
                  step="0.5"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>Square Footage (Sq.Ft.)</label>
                <input
                  type="number"
                  name="sqft"
                  value={formData.sqft}
                  onChange={handleChange}
                  placeholder="2400"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={fieldLabelStyle}>Listing Agent Name</label>
                <input
                  type="text"
                  name="listing_agent_name"
                  value={formData.listing_agent_name}
                  onChange={handleChange}
                  placeholder="e.g. Immanuel Ceballos"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={fieldLabelStyle}>Cover Image URL</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="url"
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleChange}
                    placeholder="https://cdn.listingphotos.sierrastatic.com/... or Unsplash URL"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {formData.cover_image && (
                    <img
                      src={formData.cover_image}
                      alt="Thumbnail"
                      style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Open House Availability & Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: formData.is_open_house_enabled ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            border: `1px solid ${formData.is_open_house_enabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-dark-navy, #0f172a)' }}>
                Open House Booking Availability
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                When enabled, syndicate agents can select and request open houses on this property.
              </div>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="is_open_house_enabled"
                checked={formData.is_open_house_enabled}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: formData.is_open_house_enabled ? '#059669' : '#dc2626' }}>
                {formData.is_open_house_enabled ? 'Available for Open Houses' : 'Paused / Unavailable'}
              </span>
            </label>
          </div>

        </form>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-background, #f8fafc)'
        }}>
          <div>
            {!isCreating && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Trash2 size={15} /> Remove Property
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary, #00a1e0)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0, 161, 224, 0.25)'
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving to Cloud...' : (isCreating ? 'Add & Publish Listing' : 'Save & Sync Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const fieldLabelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--color-text-main, #334155)',
  marginBottom: '0.35rem'
};

const hintStyle = {
  display: 'block',
  fontSize: '0.72rem',
  color: 'var(--color-text-muted, #64748b)',
  marginTop: '0.2rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border, #cbd5e1)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  color: 'var(--color-text-main, #0f172a)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box'
};

export default ListingEditModal;
