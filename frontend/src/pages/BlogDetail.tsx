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
        </div>
      </section>
    </div>
  );
}
