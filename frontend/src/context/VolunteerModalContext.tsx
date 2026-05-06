import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Send, X } from 'lucide-react';
import { submitVolunteer } from '../api';

interface VolunteerModalContextType {
  openVolunteer: () => void;
}

const VolunteerModalContext = createContext<VolunteerModalContextType>({ openVolunteer: () => {} });

export function VolunteerModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <VolunteerModalContext.Provider value={{ openVolunteer: () => setOpen(true) }}>
      {children}
      {open && <VolunteerModal onClose={() => setOpen(false)} />}
    </VolunteerModalContext.Provider>
  );
}

export function useVolunteer() {
  return useContext(VolunteerModalContext);
}

function VolunteerModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await submitVolunteer(formData);
      if (res.error) {
        setStatus({ type: 'error', msg: res.error });
      } else {
        setStatus({ type: 'success', msg: res.message || 'Thank you for signing up to volunteer!' });
        setFormData({ full_name: '', email: '', phone: '', message: '' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to submit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>Volunteer With Us</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
            <X size={22} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem' }}>
            Give your time and skills to impact lives for the Kingdom. Fill in the form below and we'll be in touch.
          </p>

          {status && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: status.type === 'success' ? '#f0fdf4' : '#fef2f2', color: status.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: '#374151' }}>Full Name *</label>
              <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: '#374151' }}>Email Address *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: '#374151' }}>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: '#374151' }}>How would you like to help?</label>
              <textarea name="message" rows={4} value={formData.message} onChange={handleChange} placeholder="Tell us about your skills and interests..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'var(--brand-primary, #1c5fa5)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Submitting…' : <><Send size={16} /> Sign Up</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
