import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { getFooter } from '../api';
import type { FooterContent } from '../api';
import { useDonate } from '../context/DonateModalContext';

const Navbar = ({ footerData }: { footerData: FooterContent | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { openDonate } = useDonate();

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
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {footerData?.email && (
              <a href={`mailto:${footerData.email}`} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Mail size={14} /> {footerData.email}
              </a>
            )}
            {footerData?.phone && (
              <a href={`tel:${footerData.phone}`} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={14} /> {footerData.phone}
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/volunteer" style={{ color: 'inherit', fontWeight: 500 }}>Volunteer With Us</Link>
          </div>
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

const Footer = ({ footerData }: { footerData: FooterContent | null }) => {
  return (
    <footer style={{ backgroundColor: '#0f1c2e', color: '#ffffff', padding: '4rem 0 0' }}>
      <div className="container">
        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>

          {/* Brand column */}
          <div>
            <img src="/logo.png" alt="Torchbearers Mission" style={{ height: '56px', width: 'auto', marginBottom: '1rem', filter: 'brightness(0) invert(1)' }} />
            <p style={{ color: '#ffffff', lineHeight: 1.7, fontSize: '0.95rem' }}>
              A Christian missions organization based in Ghana raising and sending missionaries across Africa and beyond.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { label: 'About Us', to: '/about' },
                { label: 'Our Projects', to: '/projects' },
                { label: 'Blog', to: '/blog' },
                { label: 'Volunteer', to: '/volunteer' },
                { label: 'Donate', to: '/donate' },
                { label: 'Contact', to: '/contact' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} style={{ color: '#ffffff', fontSize: '0.95rem', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contact Us</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {footerData?.address && (
                <li style={{ display: 'flex', gap: '0.75rem', color: '#ffffff', alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ color: '#ffffff', flexShrink: 0, marginTop: '3px' }} />
                  <span style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{footerData.address}</span>
                </li>
              )}
              {footerData?.phone && (
                <li style={{ display: 'flex', gap: '0.75rem', color: '#ffffff', alignItems: 'center' }}>
                  <Phone size={18} style={{ color: '#ffffff', flexShrink: 0 }} />
                  <a href={`tel:${footerData.phone}`} style={{ color: '#ffffff', fontSize: '0.95rem' }}>{footerData.phone}</a>
                </li>
              )}
              {footerData?.email && (
                <li style={{ display: 'flex', gap: '0.75rem', color: '#ffffff', alignItems: 'center' }}>
                  <Mail size={18} style={{ color: '#ffffff', flexShrink: 0 }} />
                  <a href={`mailto:${footerData.email}`} style={{ color: '#ffffff', fontSize: '0.95rem' }}>{footerData.email}</a>
                </li>
              )}
              {footerData?.whatsapp && (
                <li style={{ display: 'flex', gap: '0.75rem', color: '#ffffff', alignItems: 'center' }}>
                  <Phone size={18} style={{ color: '#ffffff', flexShrink: 0 }} />
                  <a href={`https://wa.me/${footerData.whatsapp}`} target="_blank" rel="noreferrer" style={{ color: '#ffffff', fontSize: '0.95rem' }}>WhatsApp</a>
                </li>
              )}
            </ul>

            {/* Social links */}
            {(footerData?.facebook || footerData?.twitter || footerData?.linkedin) && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                {footerData.facebook && (
                  <a href={footerData.facebook} target="_blank" rel="noreferrer"
                    style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}>Facebook</a>
                )}
                {footerData.twitter && (
                  <a href={footerData.twitter} target="_blank" rel="noreferrer"
                    style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}>Twitter</a>
                )}
                {footerData.linkedin && (
                  <a href={footerData.linkedin} target="_blank" rel="noreferrer"
                    style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}>LinkedIn</a>
                )}
              </div>
            )}
          </div>

          {/* Map column */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Find Us</h4>
            {footerData?.map_embed ? (
              <div
                dangerouslySetInnerHTML={{ __html: footerData.map_embed }}
                style={{ borderRadius: '10px', overflow: 'hidden', lineHeight: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(0.8) brightness(0.85)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              />
            ) : (
              <div style={{ borderRadius: '10px', overflow: 'hidden', lineHeight: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(0.8) brightness(0.85)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d254503.14786388068!2d-0.3536484!3d5.6036999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2b7a773%3A0xbed14ed8650e2dd3!2sAccra%2C%20Ghana!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                  width="100%"
                  height="280"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Torchbearers Mission Location"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', padding: '1.25rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ color: '#ffffff', margin: 0, fontSize: '0.875rem' }}>
            &copy; {new Date().getFullYear()} Torchbearers Mission Incorporated. All rights reserved.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.8rem' }}>
            Raising and sending missionaries everywhere.
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
