import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { getBlogs, getCachedPublicContent } from '../api';
import type { BlogPost } from '../api';
import { format } from 'date-fns';
import ContentUnavailable from '../components/ContentUnavailable';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>(
    () => getCachedPublicContent<BlogPost[]>('blogs') ?? [],
  );
  const [loading, setLoading] = useState(() => !getCachedPublicContent<BlogPost[]>('blogs'));
  const [hasError, setHasError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getBlogs({ forceRefresh: retryAttempt > 0 })
      .then(res => {
        if (isMounted) {
          setPosts(res);
          setHasError(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(err);
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
      <div className="loading-container" role="status" aria-label="Loading blog">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <ContentUnavailable
        title="We couldn’t load the blog"
        description="Something went wrong while loading our latest stories. Please try again."
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
          <h1 className="h1" style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Our Blog</h1>
          <p className="h4" style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            Stories, reflections, and news from the mission field.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {posts.length === 0 ? (
            <div className="text-center" style={{ padding: '4rem 0', color: 'var(--text-muted)' }}>
              <p>No blog posts published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid-3">
              {posts.map(post => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.feature_image ? (
                    <img src={post.feature_image} alt={post.title} className="card-img" style={{ height: '220px' }} />
                  ) : (
                    <div className="card-img" style={{ height: '220px', backgroundColor: 'var(--border-color)' }} />
                  )}
                  <div className="card-content">
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </div>
                    <h3 className="h4 card-title">{post.title}</h3>
                    <p className="card-text">{post.seo_description || 'Read full article...'}</p>
                    <div style={{ color: 'var(--brand-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
                      Read Article <ArrowRight size={16} />
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
