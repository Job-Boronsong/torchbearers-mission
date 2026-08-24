import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import Globe from 'lucide-react/dist/esm/icons/globe.mjs';
import { getProjects } from '../api';
import type { Project } from '../api';
import ContentUnavailable from '../components/ContentUnavailable';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getProjects()
      .then(res => {
        if (isMounted) {
          setProjects(res);
          setHasError(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [retryAttempt]);

  if (loading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading projects">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <ContentUnavailable
        title="We couldn’t load our projects"
        description="Something went wrong while loading our projects. Please try again."
        onRetry={() => {
          setLoading(true);
          setHasError(false);
          setRetryAttempt(attempt => attempt + 1);
        }}
      />
    );
  }

  return (
    <div>
      <section style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-light)', padding: '5rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 className="h1" style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Our Projects</h1>
          <p className="h4" style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            Discover how we are making a tangible difference.
          </p>
        </div>
      </section>

      <section className="section bg-color">
        <div className="container">
          {projects.length === 0 ? (
            <div className="text-center" style={{ padding: '4rem 0', color: 'var(--text-muted)' }}>
              <Globe size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No active projects available at the moment.</p>
            </div>
          ) : (
            <div className="grid-3">
              {projects.map(project => (
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
                    <div style={{ color: 'var(--brand-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                      Learn More <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
