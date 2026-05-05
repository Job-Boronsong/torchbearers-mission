import { Heart, Building, Phone } from 'lucide-react';

export default function Donate() {
  return (
    <div>
      <section style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-light)', padding: '5rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 className="h1" style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Support the Mission</h1>
          <p className="h4" style={{ opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            Your generosity fuels our work across Africa and beyond.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <Heart size={48} style={{ color: 'var(--brand-primary)', margin: '0 auto 1.5rem' }} />
            <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Partner With Us</h2>
            <p className="rich-text">
              Torchbearers Mission Incorporated relies on the faithful support of partners like you. 
              Your financial contributions go directly towards evangelism, community discipleship, and 
              our various humanitarian outreach projects.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '3rem', borderRadius: 'var(--radius-md)', marginBottom: '3rem' }}>
            <h3 className="h3 text-center" style={{ marginBottom: '2rem' }}>Ways to Give</h3>
            
            <div className="grid-2">
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>
                  <Building size={24} />
                  <h4 className="h4" style={{ margin: 0 }}>Bank Transfer</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  You can transfer your donations directly to our bank account in Ghana.
                </p>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Bank:</strong> Ecobank Ghana</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Account Name:</strong> Torchbearers Mission Inc.</div>
                  <div><strong>Account Number:</strong> Contact us for details</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>
                  <Phone size={24} />
                  <h4 className="h4" style={{ margin: 0 }}>Mobile Money</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  For quick and easy giving within Ghana, you can use MTN Mobile Money.
                </p>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Network:</strong> MTN</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> Torchbearers Mission</div>
                  <div><strong>Number:</strong> Contact us for details</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '3rem' }}>
            <h3 className="h4" style={{ marginBottom: '1rem' }}>Need assistance with your donation?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              If you have any questions or require our account details for a transfer, please don't hesitate to reach out.
            </p>
            <a href="/contact" className="btn btn-outline">Contact Us</a>
          </div>
        </div>
      </section>
    </div>
  );
}
