/**
 * NotFound — 404 catch-all page
 */
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontFamily: "'Figtree', sans-serif" }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#C9A84C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <span style={{ color: '#111', fontWeight: 800, fontSize: 20 }}>R.</span>
        </div>
        <h1 style={{ fontSize: 72, fontWeight: 800, color: '#C9A84C', margin: '0 0 8px', letterSpacing: -2 }}>404</h1>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#FFF', margin: '0 0 8px' }}>Page not found</p>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px' }}>The page you're looking for doesn't exist or has been moved.</p>
        <a href="/dashboard" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 8, background: '#C9A84C', color: '#111', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginRight: 12 }}>Go to Dashboard</a>
        <a href="https://reeveos.app" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 8, background: 'transparent', border: '1px solid #333', color: '#999', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>ReeveOS Home</a>
      </div>
    </div>
  )
}
