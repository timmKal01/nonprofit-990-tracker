const UA = 'Nonprofit990Tracker/0.1 (+contact: nonprofit-tracker-admin@example.com)';
const SEARCH_URL = 'https://projects.propublica.org/nonprofits/api/v2/search.json';
const orgUrl = (ein) => `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`;

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.status === 404 || res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`ProPublica request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`ProPublica request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

function isEin(s) {
    return /^\d{2}-?\d{7}$/.test(s.trim());
}

export async function resolveEin(entry, state) {
    if (isEin(entry)) return entry.trim().replace('-', '');

    const url = new URL(SEARCH_URL);
    url.searchParams.set('q', entry);
    if (state) url.searchParams.set('state[id]', state);

    const res = await fetchWithRetry(url, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    const top = data.organizations?.[0];
    if (!top) throw new Error(`No nonprofit found matching "${entry}"`);
    return String(top.ein);
}

export async function fetchFilings({ ein, maxFilings }) {
    const res = await fetchWithRetry(orgUrl(ein), { headers: { 'User-Agent': UA } });
    if (res.status === 404) throw new Error(`EIN not found: ${ein}`);

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
