import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getBlog } from '../api';
import type { BlogPost } from '../api';
import { format } from 'date-fns';

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getBlog(slug)
      .then(res => {
        setPost(res);
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

  if (error || !post) {
    return (
      <div className="container section text-center">
        <h2 className="h2" style={{ marginBottom: '1rem' }}>Article Not Found</h2>
        <p style={{ marginBottom: '2rem' }}>We couldn't find the article you were looking for.</p>
        <Link to="/blog" className="btn btn-outline">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div>
      <section style={{ backgroundColor: 'var(--bg-subtle)', padding: '4rem 0 3rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Blog
          </Link>
          
          <h1 className="h1" style={{ marginBottom: '1.5rem' }}>{post.title}</h1>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--text-muted)' }}>
            {post.author && (
              <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{post.author}</div>
            )}
            {post.author && <span>•</span>}
            <div>{format(new Date(post.created_at), 'MMMM d, yyyy')}</div>
          </div>
        </div>
      </section>

      {post.feature_image && (
        <div className="container" style={{ maxWidth: '1000px', marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
          <img 
            src={post.feature_image} 
            alt={post.title} 
            style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }} 
          />
        </div>
      )}

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Share + Back */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Share this article:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#25D366', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1877F2', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#000', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X
              </a>
              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent('Check out this article: ' + window.location.href)}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#6b7280', color: '#fff', padding: '0.55rem 1.1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Email
              </a>
            </div>

            <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 500, color: 'var(--text-main)', textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Back to Blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
