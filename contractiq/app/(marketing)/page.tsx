import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: 'var(--font-inter)' }}>

      {/* ── Navigation ── */}
      <nav className="marketing-nav" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        borderBottom: '1px solid #F0F0F1',
        background: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: '#115ACB',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>C</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#070A0E' }}>ContractIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/login" style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#4A4C4F',
            textDecoration: 'none',
            borderRadius: '6px',
          }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="marketing-section" style={{
        paddingTop: '96px',
        paddingBottom: '80px',
        maxWidth: '1280px',
        margin: '0 auto',
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#E7EFFC',
            color: '#115ACB',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: '24px',
          }}>
            NDA &amp; MSA review in minutes
          </div>

          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: '56px',
            color: '#070A0E',
            margin: '0 0 24px 0',
          }}>
            Understand every contract before you sign it
          </h1>

          <p style={{
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: '28px',
            color: '#4A4C4F',
            margin: '0 0 40px 0',
            maxWidth: '560px',
          }}>
            ContractIQ extracts the key terms from any NDA or MSA — with confidence scores,
            page citations, and a document-grounded chat interface. No legal training required.
          </p>

          <div className="hero-cta-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/signup" className="btn-primary">
              Start free — 5 contracts included
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>

          <p style={{
            marginTop: '16px',
            fontSize: '12px',
            color: '#8F9193',
          }}>
            14-day free trial · No credit card required · NDA and MSA contracts
          </p>

          <p style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#8F9193',
          }}>
            Not legal advice — always verify critical terms with a qualified lawyer before signing.
          </p>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <div className="marketing-section" style={{
        paddingBottom: '64px',
        maxWidth: '1280px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          padding: '20px 24px',
          background: '#FAFAFA',
          borderRadius: '8px',
          border: '1px solid #F0F0F1',
        }}>
          {[
            { label: 'Time saved per review', value: '75 min' },
            { label: 'Key terms extracted', value: '10–12' },
            { label: 'Extraction accuracy (F1)', value: '≥ 88%' },
            { label: 'Cost vs. lawyer review', value: '99% less' },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1 }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#115ACB', lineHeight: '32px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#4A4C4F', lineHeight: '18px', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="marketing-section" style={{
        paddingBottom: '96px',
        maxWidth: '1280px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 500,
          color: '#070A0E',
          marginBottom: '24px',
        }}>
          Everything you need to review a contract with confidence
        </h2>

        <div className="features-grid">
          {[
            {
              icon: '📄',
              title: 'Key term extraction',
              description:
                'Automatically pulls the 10–12 terms that matter most from any NDA or MSA: parties, governing law, termination clauses, liability caps, and more.',
            },
            {
              icon: '🎯',
              title: 'Confidence scoring',
              description:
                'Every extracted term carries a confidence score (0–100%) with colour coding. Low-confidence terms are flagged so you know exactly what to double-check.',
            },
            {
              icon: '💬',
              title: 'Chat with your contract',
              description:
                'Ask plain-English questions — "Is there an auto-renewal clause?" — and get answers grounded strictly in your document, with mandatory page citations.',
            },
            {
              icon: '📍',
              title: 'Page-level attribution',
              description:
                'Every term shows the exact page it was found on. Click the page number to jump directly to that section in the inline PDF viewer.',
            },
            {
              icon: '✏️',
              title: 'Inline editing',
              description:
                'Disagree with an extraction? Edit any term inline. The original AI value is preserved separately so corrections feed the improvement loop.',
            },
            {
              icon: '🔒',
              title: 'Secure and private',
              description:
                'Your contracts are encrypted at rest (AES-256) and in transit (TLS 1.3). Accessible only via time-limited signed URLs. GDPR-ready.',
            },
          ].map((feature) => (
            <div key={feature.title} style={{
              background: '#FFFFFF',
              border: '1px solid #F0F0F1',
              borderRadius: '8px',
              padding: '24px',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>{feature.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 500, color: '#070A0E', marginBottom: '8px', lineHeight: '24px' }}>
                {feature.title}
              </div>
              <div style={{ fontSize: '14px', color: '#4A4C4F', lineHeight: '22px' }}>
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="marketing-section" style={{
        paddingTop: '64px',
        paddingBottom: '96px',
        background: '#FAFAFA',
        borderTop: '1px solid #F0F0F1',
        borderBottom: '1px solid #F0F0F1',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 500,
            color: '#070A0E',
            marginBottom: '8px',
          }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontSize: '14px', color: '#4A4C4F', marginBottom: '32px' }}>
            $19/month = less than 5 minutes of lawyer time — and you get 10 full contract reviews.
          </p>

          <div className="pricing-grid">
            {[
              {
                name: 'Free Trial',
                price: '$0',
                period: '14 days',
                features: ['5 contract analyses', 'Full features included', 'NDA + MSA'],
                cta: 'Start free trial',
                highlight: false,
              },
              {
                name: 'Starter',
                price: '$19',
                period: '/month',
                features: ['10 contract analyses/month', 'NDA + MSA', 'Chat included'],
                cta: 'Get Starter',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$49',
                period: '/month',
                features: ['40 analyses/month', 'Custom terms', 'Export', 'Priority support'],
                cta: 'Get Growth',
                highlight: true,
              },
              {
                name: 'Pro',
                price: '$129',
                period: '/month',
                features: ['Unlimited analyses', 'Team workspace (5 seats)', 'API access'],
                cta: 'Get Pro',
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} style={{
                background: plan.highlight ? '#115ACB' : '#FFFFFF',
                border: plan.highlight ? 'none' : '1px solid #F0F0F1',
                borderRadius: '8px',
                padding: '24px',
                color: plan.highlight ? '#FFFFFF' : '#070A0E',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', opacity: plan.highlight ? 0.9 : 1 }}>
                  {plan.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 600 }}>{plan.price}</span>
                  <span style={{ fontSize: '14px', opacity: 0.7 }}>{plan.period}</span>
                </div>
                <div style={{ marginTop: '20px', marginBottom: '24px' }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{
                      fontSize: '13px',
                      lineHeight: '20px',
                      marginBottom: '6px',
                      opacity: plan.highlight ? 0.9 : 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link href="/signup" style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '8px 16px',
                  background: plan.highlight ? '#FFFFFF' : '#115ACB',
                  color: plan.highlight ? '#115ACB' : '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="marketing-section marketing-footer" style={{
        paddingTop: '32px',
        paddingBottom: '32px',
        maxWidth: '1280px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            background: '#115ACB',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>C</span>
          </div>
          <span style={{ fontSize: '14px', color: '#4A4C4F' }}>ContractIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ fontSize: '12px', color: '#8F9193', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ fontSize: '12px', color: '#8F9193', textDecoration: 'none' }}>
            Terms of Service
          </Link>
          <span style={{ fontSize: '12px', color: '#8F9193' }}>
            Powered by OpenAI GPT-4o · Not legal advice · © {new Date().getFullYear()} ContractIQ
          </span>
        </div>
      </footer>

    </div>
  )
}
