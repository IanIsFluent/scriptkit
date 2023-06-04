// @ts-check
// Name: Productive Timer Toggle Stop Current
// Description: Stops current timer in Productive
// Shortcut: ctrl+alt+shift+,
const title = 'Stop last productive timer';

// You can find it in Accounts & Settings -> API access -> Generate new token (READ / WRITE)
const API_KEY = await env('PRODUCTIVE_API_KEY', 'Productive API key');

// You can find it in Accounts & Settings -> API access -> Organization ID
const ORGANIZATION_ID = await env(
  'PRODUCTIVE_ORGANIZATION_ID',
  'Productive Organization ID'
);

// You can find it by going to Accounts & Settings -> Your Name, then look in the URL bar https://app.productive.io/{ORGANIZATION-ID}-{ORGANIZATION-NAME}/people/{PERSON_ID}/overview
const PERSON_ID = await env('PRODUCTIVE_PERSON_ID', `Productive Person ID`);

notify({ title, message: 'Stopping current timer...' });

// get running timer
const stopResp = await fetch(
  `https://api.productive.io/api/v2/timers?filter[person_id]=${PERSON_ID}&filter[stopped_at]=&sort=-started_at`,
  {
    headers: {
      'X-Auth-Token': API_KEY,
      'X-Organization-Id': ORGANIZATION_ID,
      'Content-Type': 'application/vnd.api+json',
      Accept:
        'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
    },
  }
);
const timerBody = await stopResp.json();
const timerId = timerBody?.data?.[0]?.id;

if (timerId) {
  const stoppingAction = `Stopping timer ${timerId}...`;
  // notify(md(stoppingAction));

  const resp = await fetch(
    `https://api.productive.io/api/v2/timers/${timerId}/stop`,
    {
      headers: {
        'X-Auth-Token': API_KEY,
        'X-Organization-Id': ORGANIZATION_ID,
        'Content-Type': 'application/vnd.api+json',
        Accept:
          'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
      },
      method: 'PATCH',
    }
  );

  if (resp.ok) {
    notify({
      title,
      message: `${stoppingAction}

Stopped`,
    });
    await hide();
  } else {
    div(
      md(
        `${stoppingAction}

Attempted to stop timer ${timerId}, response code: ${resp.status}
      \`\`\`
      ${JSON.stringify(resp.body)}
      \`\`\``
      )
    );
  }
} else {
  div(`No timer to stop.`);
}

export {};
