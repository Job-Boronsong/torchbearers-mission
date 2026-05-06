import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { getProject } from '../api';
import type { Project } from '../api';
import { format } from 'date-fns';
import { useDonate } from '../context/DonateModalContext';

export default function ProjectDetail() {
  const { openDonate } = useDonate();
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getProject(slug)
      .then(res => {
        setProject(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container section text-center">
        <h2 className="h2" style={{ marginBottom: '1rem' }}>Project Not Found</h2>
        <p style={{ marginBottom: '2rem' }}>We couldn't find the project you were looking for.</p>
        <Link to="/projects" className="btn btn-outline">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section style={{ backgroundColor: 'var(--bg-subtle)', padding: '4rem 0 0' }}>
        <div className="container">
          <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingBottom: '4rem' }}>
            <h1 className="h1" style={{ marginBottom: '1.5rem' }}>{project.title}</h1>
          </div>
        </div>
      </section>

      {/* Feature Image */}
      {project.feature_image && (
        <div className="container" style={{ marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
          <img 
            src={project.feature_image} 
            alt={project.title} 
            style={{ width: '100%', maxHeight: '600px', objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }} 
          />
        </div>
      )}

      {/* Content */}
      <section className="section">
        <div className="container">
          <div className="grid-3">
            <div style={{ gridColumn: 'span 1' }}>
              {/* Sidebar Info */}
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'sticky', top: '100px' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Date Launched</div>
                  <div style={{ fontWeight: 500 }}>{format(new Date(project.created_at), 'MMMM d, yyyy')}</div>
                </div>
                
                {project.show_donate && (
                  <div>
                    <h3 className="h4" style={{ marginBottom: '1rem' }}>Support this project</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      Your generous donation helps us fund and sustain this initiative.
                    </p>
                    <button onClick={openDonate} className="btn btn-primary" style={{ width: '100%', cursor: 'pointer' }}>
                      <Heart size={18} /> Donate Now
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ gridColumn: 'span 2' }}>
              <div className="rich-text" dangerouslySetInnerHTML={{ __html: project.description }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
