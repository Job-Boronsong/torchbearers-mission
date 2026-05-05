import { createContext, useContext, useState, ReactNode } from 'react';

interface DonateModalContextType {
  openDonate: () => void;
}

const DonateModalContext = createContext<DonateModalContextType>({ openDonate: () => {} });

export function DonateModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <DonateModalContext.Provider value={{ openDonate: () => setOpen(true) }}>
      {children}
      {open && <DonateModal onClose={() => setOpen(false)} />}
    </DonateModalContext.Provider>
  );
}

export function useDonate() {
  return useContext(DonateModalContext);
}

function DonateModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#111' }}>Support Torchbearers Missions</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#6b7280', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '0.95rem' }}>
            Thank you for supporting our mission. You can donate using the details below:
          </p>

          {/* MoMo */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              📱 Mobile Money (MoMo)
            </div>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#111' }}><strong>Network:</strong> AirtelTigo</p>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#111' }}><strong>MoMo Number:</strong> 027 248 9559</p>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#111' }}><strong>Name:</strong> Joseph Darling Macarthy</p>
          </div>

          {/* Bank */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              🏦 Bank Transfer
            </div>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#111' }}><strong>Bank:</strong> ECOBANK</p>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#111' }}><strong>Branch:</strong> Silver Star (Swift Code: ECOCGHAC)</p>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#111' }}><strong>Account Name:</strong> Torchbearers Mission Inc.</p>
            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: '#111' }}><strong>Account Number:</strong> 1441000160464</p>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>Official payments gateway coming soon.</p>
          </div>

          {/* Note */}
          <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#1d4ed8' }}>
            📌 Please include your name as reference if possible. God bless you for your support.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
