import { Mail } from 'lucide-react';
import { Container, PageHeader, Divider, Card } from '../components/ui';
import { LEGAL } from '../theme/legal';

export default function Legal() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '48px 0' }}>
        <Container size="md">
          <PageHeader label={LEGAL.label} title={LEGAL.pageTitle} subtitle={`Last updated: ${LEGAL.lastUpdated}`} />
        </Container>
      </div>
      <Container size="md" style={{ padding: '40px 24px' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {LEGAL.sections.map((s, i) => (
              <div key={i}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{s.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted-ink)', lineHeight: 1.8 }}>{s.body}</p>
                {i < LEGAL.sections.length - 1 && <Divider style={{ marginTop: 28 }} />}
              </div>
            ))}
            <Divider />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', background: 'var(--paper2)', border: '1.25px solid var(--border)', borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--primary-soft)', border: '1.25px solid var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><Mail size={16} /></div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 4 }}>{LEGAL.contact.title}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-ink)', lineHeight: 1.6 }}>{LEGAL.contact.text}</p>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
