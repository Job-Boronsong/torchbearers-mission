import { useState, useEffect } from 'react';
import { getAbout } from '../api';
import type { AboutData } from '../api';

export default function About() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAbout()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section style={{
        position: 'relative',
        color: 'var(--text-light)',
        padding: '9rem 0',
        textAlign: 'center',
        backgroundColor: '#111',
        overflow: 'hidden',
      }}>
        {data?.mission_vision?.hero_image && (
          <img
            src={data.mission_vision.hero_image}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              pointerEvents: 'none',
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="h1" style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            {data?.mission_vision?.hero_title || 'About Us'}
          </h1>
          {(data?.mission_vision?.hero_subtitle) && (
            <p className="h4" style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
              {data.mission_vision.hero_subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Who We Are */}
      {data?.who_we_are && (
        <section className="section">
          <div className="container" style={{ maxWidth: '800px' }}>
            <h2 className="h2 text-center" style={{ marginBottom: '2rem' }}>{data.who_we_are.title || 'Who We Are'}</h2>
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: data.who_we_are.content }} />
          </div>
        </section>
      )}

      {/* Director's Message */}
      {data?.director_message && data.director_message.message && (
        <section className="section" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <div className="container" style={{ maxWidth: '860px' }}>
            <h2 className="h2 text-center" style={{ marginBottom: '3rem' }}>Message from the Director</h2>
            <div style={{
              display: 'flex',
              gap: '2.5rem',
              alignItems: 'flex-start',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              padding: '2.5rem',
              borderLeft: '5px solid var(--brand-gold, #c9a84c)',
            }}>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: 'var(--border-color)',
                  margin: '0 auto 0.75rem',
                }}>
                  {data.director_message.photo ? (
                    <img
                      src={data.director_message.photo}
                      alt={data.director_message.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-muted)' }}>
                      {data.director_message.name.charAt(0)}
                    </div>
                  )}
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{data.director_message.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', margin: '0.2rem 0 0' }}>{data.director_message.role}</p>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '4rem', lineHeight: 1, color: 'var(--brand-gold, #c9a84c)', display: 'block', marginBottom: '-1rem', fontFamily: 'Georgia, serif' }}>&ldquo;</span>
                <div className="rich-text text-muted" style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: data.director_message.message }} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      {data?.mission_vision && (
        <section className="section" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <div className="container">
            <div className="grid-2">
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 className="h3" style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>Vision & Purpose</h3>
                <div className="rich-text text-muted" dangerouslySetInnerHTML={{ __html: data.mission_vision.vision_and_purpose }} />
              </div>
              <div style={{ background: 'linear-gradient(135deg, #1a3faa 0%, #2979ff 100%)', padding: '3rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 className="h3" style={{ color: '#fff', marginBottom: '1.5rem' }}>Statement of Faith</h3>
                <div className="rich-text" style={{ color: 'rgba(255,255,255,0.92)' }} dangerouslySetInnerHTML={{ __html: data.mission_vision.statement_of_faith }} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {data?.team && data.team.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="h2 text-center" style={{ marginBottom: '3rem' }}>Our Leadership</h2>
            <div className="grid-4">
              {data.team.map(member => (
                <div key={member.id} className="card text-center" style={{ padding: '2rem 1.5rem' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1.5rem', overflow: 'hidden', backgroundColor: 'var(--border-color)' }}>
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-muted)' }}>
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 700 }}>{member.name}</h3>
                  <p style={{ color: 'var(--brand-primary)', fontWeight: 500, fontSize: '0.78rem' }}>{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
