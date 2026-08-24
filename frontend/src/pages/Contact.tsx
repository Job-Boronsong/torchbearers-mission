import { useState } from 'react';
import Mail from 'lucide-react/dist/esm/icons/mail.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Phone from 'lucide-react/dist/esm/icons/phone.mjs';
import Send from 'lucide-react/dist/esm/icons/send.mjs';
import { isAxiosError } from 'axios';
import { submitContact } from '../api';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
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
      const res = await submitContact(formData);
      if (res.error) {
        setStatus({ type: 'error', msg: res.error });
      } else {
        setStatus({ type: 'success', msg: res.message || 'Message sent successfully. We will get back to you soon!' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err: unknown) {
      const message = isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined;
      setStatus({ type: 'error', msg: message || 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-light)', padding: '5rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 className="h1" style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Get in Touch</h1>
          <p className="h4" style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            We would love to hear from you.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2">
            <div>
              <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Contact Information</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.125rem' }}>
                Have questions about our mission, want to partner with us, or simply want to say hello? Reach out using the form or our contact details below.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="h4" style={{ marginBottom: '0.25rem' }}>Our Office</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Accra, Ghana</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="h4" style={{ marginBottom: '0.25rem' }}>Email Us</h3>
                    <p style={{ color: 'var(--text-muted)' }}>info@torchbearersmission.org</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="h4" style={{ marginBottom: '0.25rem' }}>Call Us</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Contact available upon request</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
              <h2 className="h3" style={{ marginBottom: '2rem' }}>Send a Message</h2>
              
              {status && (
                <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {status.msg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" className="form-input" required value={formData.name} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="subject">Subject</label>
                  <input type="text" id="subject" name="subject" className="form-input" required value={formData.subject} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="message">Message</label>
                  <textarea id="message" name="message" className="form-textarea" required value={formData.message} onChange={handleChange}></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                  {loading ? 'Sending...' : <><Send size={18} /> Send Message</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
