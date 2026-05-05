import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { unsubscribeNewsletter } from '../api';

export default function Unsubscribe() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    unsubscribeNewsletter(token)
      .then(res => {
        if (res.error) {
          setStatus({ type: 'error', msg: res.error });
        } else {
          setStatus({ type: 'success', msg: res.message || 'You have been unsubscribed successfully.' });
        }
        setLoading(false);
      })
      .catch(err => {
        setStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to unsubscribe. The link may be invalid.' });
        setLoading(false);
      });
  }, [token]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '4rem 3rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <>
            {status?.type === 'success' ? (
              <CheckCircle size={64} style={{ color: '#2e7d32', margin: '0 auto 1.5rem' }} />
            ) : (
              <XCircle size={64} style={{ color: '#c62828', margin: '0 auto 1.5rem' }} />
            )}
            
            <h1 className="h2" style={{ marginBottom: '1rem' }}>
              {status?.type === 'success' ? 'Unsubscribed' : 'Unsubscribe Failed'}
            </h1>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.125rem' }}>
              {status?.msg}
            </p>
            
            <Link to="/" className="btn btn-primary">Return to Homepage</Link>
          </>
        )}
      </div>
    </div>
  );
}
