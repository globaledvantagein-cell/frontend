import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { companiesPage } from '../theme/companies-content';
import { useMediaQuery } from '../hooks/useMediaQuery';

const AVATAR_COLORS = [
    '#4A90D9', '#50B88E', '#E8915A', '#9B6FD1',
    '#D4697A', '#5AADBA', '#7B9E5F', '#C4883D',
    '#6C7FD1', '#D15F8A',
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

import { ExternalLink } from 'lucide-react';

interface Company {
    companyName: string;
    source: 'scraped' | 'manual';
    openRoles: number;
    cities?: string[];
    careersUrl?: string;
    domain?: string;
}

function CompanyCard({ company }: { company: Company }) {
    const navigate = useNavigate();
    const isScraped = company.source === 'scraped';

    const handleCardClick = (company: Company) => {
        if (company.source === 'scraped') {
            navigate('/jobs');
        } else if (company.careersUrl) {
            window.open(company.careersUrl, '_blank', 'noopener,noreferrer');
        } else if (company.domain) {
            window.open(`https://${company.domain}/careers`, '_blank', 'noopener,noreferrer');
        } else {
            navigate('/jobs');
        }
    };

    return (
        <div
            tabIndex={0}
            role="button"
            aria-label={company.companyName}
            onClick={() => handleCardClick(company)}
            onKeyDown={e => { if (e.key === 'Enter') handleCardClick(company); }}
            style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
                margin: 0,
                outline: 'none',
                boxShadow: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(0,0,0,0.06)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            title={
                isScraped
                    ? 'Browse jobs at this company'
                    : 'Visit careers page'
            }
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 8, background: getAvatarColor(company.companyName || ''),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#fff', userSelect: 'none',
                }}>{(company.companyName || '').charAt(0).toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{company.companyName}</div>
            </div>
            {company.cities && company.cities.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10 }}>
                    <MapPin size={12} style={{ marginRight: 2 }} />
                    {company.cities.join(', ')}
                </div>
            )}
            <div style={{ fontSize: '0.78rem', fontWeight: isScraped ? 600 : 500, color: isScraped ? 'var(--primary)' : 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {isScraped
                    ? <>
                        {companiesPage.scrapedLabel(company.openRoles)}
                        <span style={{ fontSize: 14, marginLeft: 2 }}>→</span>
                    </>
                    : <>
                        {companiesPage.manualLabel}
                        <ExternalLink size={11} style={{ marginLeft: 3, marginBottom: 1 }} />
                    </>
                }
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', minHeight: 92, display: 'flex', flexDirection: 'column', gap: 10, animation: 'pulse 1.2s infinite ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--border)', opacity: 0.5 }} />
                <div style={{ width: 90, height: 14, borderRadius: 4, background: 'var(--border)', opacity: 0.5 }} />
            </div>
            <div style={{ width: 70, height: 10, borderRadius: 4, background: 'var(--border)', opacity: 0.4, marginTop: 10 }} />
            <div style={{ width: 120, height: 10, borderRadius: 4, background: 'var(--border)', opacity: 0.3, marginTop: 6 }} />
        </div>
    );
}

export default function CompanyDirectory() {
    const [companies, setCompanies] = useState<Company[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCount, setShowCount] = useState(30);

    useEffect(() => {
        document.title = companiesPage.title;
        setLoading(true);
        fetch('/api/jobs/directory')
            .then(r => r.json())
            .then(data => {
                setCompanies(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setCompanies([]);
                setLoading(false);
            });
    }, []);

    // Sort: scraped (openRoles desc), then manual (alpha)
    const sortedCompanies = useMemo(() => {
        if (!companies) return [];
        const scraped = companies.filter((c: Company) => c.source === 'scraped').sort((a: Company, b: Company) => b.openRoles - a.openRoles);
        const manual = companies.filter((c: Company) => c.source === 'manual').sort((a: Company, b: Company) => a.companyName.localeCompare(b.companyName));
        return [...scraped, ...manual];
    }, [companies]);

    // Filter by search
    const filteredCompanies = useMemo(() => {
        if (!search.trim()) return sortedCompanies;
        const q = search.trim().toLowerCase();
        return sortedCompanies.filter((c: Company) => (c.companyName || '').toLowerCase().includes(q));
    }, [sortedCompanies, search]);

    // Stats
    const totalCompanies = sortedCompanies.length;
    const totalRoles = sortedCompanies.reduce((sum, c) => sum + (c.openRoles || 0), 0);

    // Show more logic
    const visibleCompanies = search.trim() ? filteredCompanies : filteredCompanies.slice(0, showCount);
    const moreRemaining = search.trim() ? 0 : Math.max(0, filteredCompanies.length - showCount);

    // Responsive grid columns
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');
    const gridCols = isMobile ? 'repeat(1, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';

    return (
        <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: 48 }}>
            {/* Hero Section with Gradient */}
            <div style={{
                background: 'linear-gradient(180deg, rgba(147,197,253,0.18) 0%, rgba(134,239,172,0.10) 50%, transparent 100%)',
                paddingTop: 60,
                paddingBottom: 48,
                marginBottom: 32,
                textAlign: 'center',
            }}>
                <h1 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, textAlign: 'center', fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: 'var(--text-primary)', margin: 0 }}>{companiesPage.title}</h1>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75, maxWidth: 680, margin: '22px auto 28px', textAlign: 'center' }}>{companiesPage.intro}</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setShowCount(30); }}
                            placeholder="Search companies..."
                            style={{
                                width: '100%', height: 42, borderRadius: 22, background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                                paddingLeft: 40, fontSize: '0.88rem', fontFamily: 'inherit', color: 'var(--text-primary)', outline: 'none',
                            }}
                        />
                    </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 0, marginTop: 2 }}>
                    {totalCompanies} companies · {totalRoles} open roles
                </div>
            </div>

            {/* Section Header (centered) */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', marginTop: 38, marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: 2, textAlign: 'center' }}>{companiesPage.sectionTitle}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 18, textAlign: 'center' }}>{companiesPage.sectionSubtitle}</div>
            </div>

            {/* Company Grid */}
            <div
                style={{
                    display: 'grid',
                    gap: 14,
                    margin: '0 auto',
                    maxWidth: 1100,
                    padding: '0 16px',
                    width: '100%',
                    gridTemplateColumns: gridCols,
                }}
                className="company-directory-grid"
            >
                {loading ? (
                    Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                ) : visibleCompanies.length > 0 ? (
                    visibleCompanies.map((company, i) => <CompanyCard key={company.companyName + i} company={company} />)
                ) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.02rem', margin: '32px 0' }}>No companies match your search</div>
                )}
            </div>

            {/* Load More Button */}
            {!search.trim() && moreRemaining > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <button
                        onClick={() => setShowCount(c => c + 30)}
                        style={{
                            height: 40, padding: '0 28px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10,
                            fontSize: '0.92rem', fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        Load more
                    </button>
                </div>
            )}

            {/* Disclaimer */}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textAlign: 'center', maxWidth: 600, margin: '32px auto 0' }}>
                {companiesPage.disclaimer}
            </div>
        </div>
    );
}