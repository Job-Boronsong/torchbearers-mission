import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { getFooter, subscribeNewsletter } from '../api';
import type { FooterContent } from '../api';
import { useDonate } from '../context/DonateModalContext';
import { useVolunteer } from '../context/VolunteerModalContext';

const Navbar = ({ footerData }: { footerData: FooterContent | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { openDonate } = useDonate();
  const { openVolunteer } = useVolunteer();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Projects', path: '/projects' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="navbar-wrapper" style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-light)', padding: '0.5rem 0', fontSize: '0.875rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button onClick={openVolunteer} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 500, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>Volunteer With Us</button>
        </div>
      </div>

      {/* Main Nav */}
      <div className="container" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
          <img
            src="/logo.png"
            alt="Torchbearers Mission Incorporated"
            style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>
            Torchbearers Mission<br />
            <span style={{ color: 'var(--brand-secondary)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Incorporated</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'none' }} className="desktop-nav">
          <ul style={{ display: 'flex', listStyle: 'none', gap: '2rem', margin: 0, padding: 0, alignItems: 'center' }}>
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  style={{ 
                    color: location.pathname === link.path ? 'var(--brand-primary)' : 'var(--text-main)',
                    fontWeight: location.pathname === link.path ? 600 : 500,
                    fontSize: '1rem'
                  }}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            <li>
              <button onClick={openDonate} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                <Heart size={18} /> Donate
              </button>
            </li>
          </ul>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="mobile-toggle" 
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-main)' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '1rem', boxShadow: 'var(--shadow-md)' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  style={{ 
                    display: 'block',
                    padding: '0.5rem',
                    color: location.pathname === link.path ? 'var(--brand-primary)' : 'var(--text-main)',
                    fontWeight: location.pathname === link.path ? 600 : 500,
                  }}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            <li>
              <button onClick={openDonate} className="btn btn-primary" style={{ display: 'flex', width: '100%', gap: '0.5rem', cursor: 'pointer' }}>
                <Heart size={18} /> Donate
              </button>
            </li>
          </ul>
        </div>
      )}
      
      <style>{`
        @media (min-width: 992px) {
          .desktop-nav { display: block !important; }
        }
        @media (max-width: 991px) {
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
};

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const Footer = ({ footerData }: { footerData: FooterContent | null }) => {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubStatus('loading');
    try {
      await subscribeNewsletter({ email });
      setSubStatus('ok');
      setEmail('');
    } catch {
      setSubStatus('err');
    }
  };

  const mapEmbed = footerData?.map_embed
    ? footerData.map_embed
    : `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d254503.14786388068!2d-0.3536484!3d5.6036999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2b7a773%3A0xbed14ed8650e2dd3!2sAccra%2C%20Ghana!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s" width="100%" height="220" style="border:0;display:block;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Torchbearers Mission Location"></iframe>`;

  const col: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
  const heading: React.CSSProperties = { color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.25rem', letterSpacing: '0.01em' };
  const row: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '0.85rem', color: '#fff', fontSize: '0.9rem', lineHeight: 1.5 };
  const linkStyle: React.CSSProperties = { color: '#fff', fontSize: '0.9rem', textDecoration: 'none' };

  return (
    <footer style={{ backgroundColor: '#0f1c2e', color: '#fff' }}>
      <div className="container" style={{ padding: '3rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>

          {/* 1 — Contact Us */}
          <div style={col}>
            <h4 style={heading}>Contact Us</h4>
            {footerData?.address && (
              <div style={row}>
                <MapPin size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{footerData.address}</span>
              </div>
            )}
            {footerData?.email && (
              <div style={row}>
                <Mail size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <a href={`mailto:${footerData.email}`} style={linkStyle}>{footerData.email}</a>
              </div>
            )}
            {footerData?.phone && (
              <div style={row}>
                <Phone size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <a href={`tel:${footerData.phone}`} style={linkStyle}>{footerData.phone}</a>
              </div>
            )}
            {footerData?.whatsapp && (
              <div style={row}>
                <span style={{ flexShrink: 0, marginTop: 1 }}><WhatsAppIcon /></span>
                <a href={`https://wa.me/${footerData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={linkStyle}>{footerData.whatsapp}</a>
              </div>
            )}
            {footerData?.facebook && (
              <div style={{ marginTop: '0.5rem' }}>
                <a href={footerData.facebook} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>
                  <FacebookIcon />
                </a>
              </div>
            )}
          </div>

          {/* 2 — Our Location */}
          <div style={col}>
            <h4 style={heading}>Our Location</h4>
            <div
              dangerouslySetInnerHTML={{ __html: mapEmbed }}
              style={{ borderRadius: '8px', overflow: 'hidden', lineHeight: 0, height: '200px' }}
            />
          </div>

          {/* 3 — Quick Links */}
          <div style={col}>
            <h4 style={heading}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {[
                { label: 'Home',     to: '/' },
                { label: 'About',    to: '/about' },
                { label: 'Projects', to: '/projects' },
                { label: 'Blog',     to: '/blog' },
                { label: 'Contact',  to: '/contact' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} style={linkStyle}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4 — Newsletter */}
          <div style={col}>
            <h4 style={heading}>Newsletter</h4>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Stay updated with our latest news and mission updates.
            </p>
            {subStatus === 'ok' ? (
              <p style={{ color: '#4ade80', fontSize: '0.9rem' }}>Thanks for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0', borderRadius: '6px', overflow: 'hidden', maxWidth: '320px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  style={{ flex: 1, padding: '0.65rem 0.85rem', border: 'none', fontSize: '0.9rem', outline: 'none', minWidth: 0, backgroundColor: '#fff', color: '#111' }}
                />
                <button
                  type="submit"
                  disabled={subStatus === 'loading'}
                  style={{ padding: '0.65rem 1.1rem', backgroundColor: '#f5a800', color: '#111', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                >
                  {subStatus === 'loading' ? '...' : 'Subscribe'}
                </button>
              </form>
            )}
            {subStatus === 'err' && (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>Something went wrong. Try again.</p>
            )}
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '1.1rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Torchbearers Mission Incorporated. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export const Layout = ({ children }: { children: ReactNode }) => {
  const [footerData, setFooterData] = useState<FooterContent | null>(null);

  useEffect(() => {
    getFooter().then(setFooterData).catch(console.error);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar footerData={footerData} />
      <main style={{ flexGrow: 1 }}>
        {children}
      </main>
      <Footer footerData={footerData} />
    </div>
  );
};
