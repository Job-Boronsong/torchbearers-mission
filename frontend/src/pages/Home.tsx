import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHome, subscribeNewsletter } from '../api';
import type { HomeData } from '../api';
import { format } from 'date-fns';
import { useDonate } from '../context/DonateModalContext';

export default function Home() {
  const { openDonate } = useDonate();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nlStatus, setNlStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    getHome()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data?.slides?.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % data.slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [data?.slides]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setNlStatus(null);
    try {
      const res = await subscribeNewsletter({ email, first_name: firstName });
      if (res.error) {
        setNlStatus({ type: 'error', msg: res.error });
      } else {
        setNlStatus({ type: 'success', msg: res.message || 'Subscribed successfully!' });
        setEmail('');
        setFirstName('');
      }
    } catch (err: any) {
      setNlStatus({ type: 'error', msg: err.response?.data?.error || 'An error occurred. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Carousel */}
      {data?.slides && data.slides.length > 0 ? (
        <section style={{ position: 'relative', height: '80vh', minHeight: '600px', overflow: 'hidden', backgroundColor: 'var(--text-main)' }}>
          {data.slides.map((slide, index) => (
            <div 
              key={slide.id}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: index === currentSlide ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                zIndex: index === currentSlide ? 1 : 0,
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${slide.image || ''})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
              
              <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  maxWidth: '800px', 
                  margin: slide.layout === 'center' ? '0 auto' : slide.layout === 'right' ? '0 0 0 auto' : '0',
                  textAlign: slide.layout === 'center' ? 'center' : slide.layout === 'right' ? 'right' : 'left',
                  color: 'white'
                }}>
                  <h1 className="h1" style={{ color: 'white', marginBottom: '1.5rem', transform: `translateY(${index === currentSlide ? 0 : '20px'})`, opacity: index === currentSlide ? 1 : 0, transition: 'all 0.8s ease-out 0.2s' }}>
                    {slide.title}
                  </h1>
                  <p className="h4" style={{ marginBottom: '2rem', color: 'rgba(255,255,255,0.9)', transform: `translateY(${index === currentSlide ? 0 : '20px'})`, opacity: index === currentSlide ? 1 : 0, transition: 'all 0.8s ease-out 0.4s' }}>
                    {slide.subtitle}
                  </p>
                  {slide.button_text && (
                    <div style={{ transform: `translateY(${index === currentSlide ? 0 : '20px'})`, opacity: index === currentSlide ? 1 : 0, transition: 'all 0.8s ease-out 0.6s' }}>
                      <Link to={slide.button_link || '/'} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                        {slide.button_text}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {data.slides.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? data.slides.length - 1 : prev - 1))}
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '50%' }}
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % data.slides.length)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '50%' }}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </section>
      ) : (
        <section style={{ padding: '8rem 0', backgroundColor: 'var(--text-main)', color: 'white', textAlign: 'center' }}>
          <div className="container">
            <h1 className="h1" style={{ color: 'white' }}>Carrying the Light</h1>
            <p className="h4" style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '0 auto 2rem' }}>Spreading hope, truth, and love across Africa and beyond.</p>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {data && (
        <section style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-light)', padding: '4rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="container">
            <div className="grid-3 text-center">
              <div>
                <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                  ₵{data.total_donations}
                </div>
                <div style={{ fontSize: '1.125rem', opacity: 0.9 }}>Total Donations</div>
              </div>
              <div>
                <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                  {data.donor_count}
                </div>
                <div style={{ fontSize: '1.125rem', opacity: 0.9 }}>Generous Donors</div>
              </div>
              <div>
                <Globe size={48} style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
                  {data.featured_projects?.length || 0}+
                </div>
                <div style={{ fontSize: '1.125rem', opacity: 0.9 }}>Active Projects</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {data?.featured_projects && data.featured_projects.length > 0 && (
        <section className="section bg-subtle">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
              <div>
                <h2 className="h2">Our Projects</h2>
                <p style={{ color: 'var(--text-muted)' }}>See where we are making an impact.</p>
              </div>
              <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                View All <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="grid-3">
              {data.featured_projects.map(project => (
                <Link to={`/projects/${project.slug}`} key={project.id} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {project.feature_image ? (
                    <img src={project.feature_image} alt={project.title} className="card-img" />
                  ) : (
                    <div className="card-img" style={{ backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={48} color="var(--text-muted)" />
                    </div>
                  )}
                  <div className="card-content">
                    <h3 className="h4 card-title">{project.title}</h3>
                    <p className="card-text">{project.excerpt || 'Read more about this project and how you can support it.'}</p>
                    <div style={{ color: 'var(--brand-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                      Learn More <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section style={{ padding: '6rem 0', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Join the Mission</h2>
          <p className="rich-text" style={{ marginBottom: '3rem' }}>
            Whether through your time, your resources, or your prayers, your partnership enables us to reach further and impact more lives with the Gospel and humanitarian aid.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={openDonate} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem', cursor: 'pointer' }}>
              <Heart size={20} /> Donate Now
            </button>
            <Link to="/volunteer" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
              <Users size={20} /> Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Blog */}
      {data?.featured_blogs && data.featured_blogs.length > 0 && (
        <section className="section bg-subtle">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
              <div>
                <h2 className="h2">Latest Updates</h2>
                <p style={{ color: 'var(--text-muted)' }}>Stories and news from the field.</p>
              </div>
              <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                Read Blog <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="grid-3">
              {data.featured_blogs.map(post => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.feature_image ? (
                    <img src={post.feature_image} alt={post.title} className="card-img" style={{ height: '200px' }} />
                  ) : (
                    <div className="card-img" style={{ height: '200px', backgroundColor: 'var(--border-color)' }} />
                  )}
                  <div className="card-content">
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {format(new Date(post.created_at), 'MMMM d, yyyy')}
                    </div>
                    <h3 className="h4 card-title">{post.title}</h3>
                    <div style={{ color: 'var(--brand-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                      Read Article <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section style={{ backgroundColor: 'var(--brand-primary)', padding: '5rem 0' }}>
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <h2 className="h2" style={{ color: '#ffffff', marginBottom: '1rem' }}>Stay Connected</h2>
          <p style={{ color: 'rgba(255,255,255,0.88)', marginBottom: '2rem' }}>
            Subscribe to our newsletter for updates, prayer points, and stories of transformation.
          </p>
          
          {nlStatus && (
            <div className={`alert ${nlStatus.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {nlStatus.msg}
            </div>
          )}

          <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="First Name (optional)" 
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={{ flex: '1 1 200px' }}
              />
              <input 
                type="email" 
                className="form-input" 
                placeholder="Email Address *" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: '2 1 300px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
