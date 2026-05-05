import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { getFooter } from '../api';
import type { FooterContent } from '../api';

const Navbar = ({ footerData }: { footerData: FooterContent | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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
              <Link to="/donate" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
                <Heart size={18} /> Donate
              </Link>
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
              <Link to="/donate" className="btn btn-primary" style={{ display: 'flex', width: '100%', gap: '0.5rem' }}>
                <Heart size={18} /> Donate
              </Link>
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
    <footer style={{ backgroundColor: '#1f1f1f', color: '#fbf9f6', padding: '4rem 0 2rem' }}>
      <div className="container">
        <div className="grid-3" style={{ marginBottom: '3rem' }}>
          <div>
            <h3 style={{ color: 'var(--brand-secondary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Torchbearers</h3>
            <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
              A Christian missions organization based in Ghana that raises and sends missionaries across Africa and beyond.
            </p>
          </div>
          
          <div>
            <h4 style={{ color: '#fff', marginBottom: '1.5rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="/about" style={{ color: '#ccc' }}>About Us</Link></li>
              <li><Link to="/projects" style={{ color: '#ccc' }}>Our Projects</Link></li>
              <li><Link to="/volunteer" style={{ color: '#ccc' }}>Volunteer</Link></li>
              <li><Link to="/donate" style={{ color: '#ccc' }}>Donate</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: '#fff', marginBottom: '1.5rem' }}>Contact Info</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {footerData?.address && (
                <li style={{ display: 'flex', gap: '0.75rem', color: '#ccc' }}>
                  <MapPin size={20} style={{ color: 'var(--brand-secondary)', flexShrink: 0 }} />
                  <span>{footerData.address}</span>
                </li>
              )}
              {footerData?.phone && (
                <li style={{ display: 'flex', gap: '0.75rem', color: '#ccc' }}>
                  <Phone size={20} style={{ color: 'var(--brand-secondary)', flexShrink: 0 }} />
                  <a href={`tel:${footerData.phone}`} style={{ color: 'inherit' }}>{footerData.phone}</a>
                </li>
              )}
              {footerData?.email && (
                <li style={{ display: 'flex', gap: '0.75rem', color: '#ccc' }}>
                  <Mail size={20} style={{ color: 'var(--brand-secondary)', flexShrink: 0 }} />
                  <a href={`mailto:${footerData.email}`} style={{ color: 'inherit' }}>{footerData.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #333', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: '#888', margin: 0, fontSize: '0.875rem' }}>
            &copy; {new Date().getFullYear()} Torchbearers Mission Incorporated. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {footerData?.facebook && <a href={footerData.facebook} target="_blank" rel="noreferrer" style={{ color: '#ccc' }}>Facebook</a>}
            {footerData?.twitter && <a href={footerData.twitter} target="_blank" rel="noreferrer" style={{ color: '#ccc' }}>Twitter</a>}
            {footerData?.linkedin && <a href={footerData.linkedin} target="_blank" rel="noreferrer" style={{ color: '#ccc' }}>LinkedIn</a>}
          </div>
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
