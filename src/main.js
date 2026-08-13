import { Actor, log } from 'apify';
import { resolveEin, fetchFilings } from './propublica.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { organizations = [], state, maxFilingsReturned = 3 } = input;

if (organizations.length === 0) {
    throw new Error('No organizations provided.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const ORG_CHECKED_EVENT = 'org-checked';

for (const entry of organizations) {
    let filings;
    try {
        const ein = await resolveEin(entry, state);
        filings = await fetchFilings({ ein, maxFilings: Math.min(maxFilingsReturned, 10) });
    } catch (err) {
        log.warning(`Failed to fetch filings`, { entry, error: err.message });
        continue;
    }

    if (filings.length > 0) {
        await Actor.pushData(filings);
    }
    await Actor.charge({ eventName: ORG_CHECKED_EVENT });

    log.info(`Checked organization`, { entry, filingsFound: filings.length });
}

await Actor.exit();
