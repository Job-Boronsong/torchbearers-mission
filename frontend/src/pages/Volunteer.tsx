import { useState } from 'react';
import { Users, Send } from 'lucide-react';
import { isAxiosError } from 'axios';
import { submitVolunteer } from '../api';

export default function Volunteer() {
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
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
    } catch (err: unknown) {
      const message = isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setStatus({ type: 'error', msg: message || 'Failed to submit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-light)', padding: '5rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 className="h1" style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Volunteer With Us</h1>
          <p className="h4" style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            Give your time and skills to impact lives for the Kingdom.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2">
            <div>
              <Users size={48} style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }} />
              <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Why Volunteer?</h2>
              <div className="rich-text" style={{ color: 'var(--text-muted)' }}>
                <p>
                  The harvest is plentiful, but the workers are few. By volunteering with Torchbearers Mission, 
                  you become a vital part of what God is doing across Africa. 
                </p>
                <p>
                  Whether it's joining an outreach mission, providing professional skills remotely, or helping organize local events, 
                  there is a place for you to serve.
                </p>
                <ul style={{ marginTop: '2rem' }}>
                  <li>Participate in medical and humanitarian outreaches</li>
                  <li>Join our evangelism and discipleship teams</li>
                  <li>Offer administrative, media, or technical support</li>
                  <li>Help organize community youth programs</li>
                </ul>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
              <h2 className="h3" style={{ marginBottom: '2rem' }}>Volunteer Signup</h2>
              
              {status && (
                <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {status.msg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="full_name">Full Name *</label>
                  <input type="text" id="full_name" name="full_name" className="form-input" required value={formData.full_name} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address *</label>
                  <input type="email" id="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="message">How would you like to help?</label>
                  <textarea id="message" name="message" className="form-textarea" placeholder="Tell us about your skills and interests..." value={formData.message} onChange={handleChange}></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                  {loading ? 'Submitting...' : <><Send size={18} /> Sign Up</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
