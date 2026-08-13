const UA = 'Nonprofit990Tracker/0.1 (+contact: nonprofit-tracker-admin@example.com)';
const SEARCH_URL = 'https://projects.propublica.org/nonprofits/api/v2/search.json';
const orgUrl = (ein) => `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`;

function isEin(s) {
    return /^\d{2}-?\d{7}$/.test(s.trim());
}

export async function resolveEin(entry, state) {
    if (isEin(entry)) return entry.trim().replace('-', '');

    const url = new URL(SEARCH_URL);
    url.searchParams.set('q', entry);
    if (state) url.searchParams.set('state[id]', state);

    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`ProPublica search failed for "${entry}": ${res.status}`);

    const data = await res.json();
    const top = data.organizations?.[0];
    if (!top) throw new Error(`No nonprofit found matching "${entry}"`);
    return String(top.ein);
}

export async function fetchFilings({ ein, maxFilings }) {
    const res = await fetch(orgUrl(ein), { headers: { 'User-Agent': UA } });
    if (res.status === 404) throw new Error(`EIN not found: ${ein}`);
    if (!res.ok) throw new Error(`ProPublica lookup failed for EIN ${ein}: ${res.status}`);

    const data = await res.json();
    const org = data.organization;
    if (!org) throw new Error(`No organization data for EIN ${ein}`);

    const filings = (data.filings_with_data ?? []).slice(0, maxFilings);

    return filings.map((f) => ({
        ein: org.ein,
        orgName: org.name,
        nteeCode: org.ntee_code,
        city: org.city,
        state: org.state,
        taxYear: f.tax_prd_yr,
        totalRevenue: f.totrevenue,
        totalExpenses: f.totfuncexpns,
        totalAssetsEnd: f.totassetsend,
        totalLiabilitiesEnd: f.totliabend,
        filingUpdatedAt: f.updated,
        pdfUrl: f.pdf_url,
    }));
}
