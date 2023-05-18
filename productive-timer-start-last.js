// @ts-check
// Name: Productive Timer Toggle Start Last
// Description: Starts last timer in Productive
// Shortcut: ctrl+alt+shift+.
const title = 'Start last productive timer';

// You can find it in Accounts & Settings -> API access -> Generate new token (READ / WRITE)
const API_KEY = await env('PRODUCTIVE_API_KEY', ` Productive API key`);

// You can find it in Accounts & Settings -> API access -> Organization ID
const ORGANIZATION_ID = await env(
  'PRODUCTIVE_ORGANIZATION_ID',
  `Productive Organization ID`
);

// You can find it by going to Accounts & Settings -> Your Name, then look in the URL bar https://app.productive.io/{ORGANIZATION-ID}-{ORGANIZATION-NAME}/people/{PERSON_ID}/overview
const PERSON_ID = await env('PRODUCTIVE_PERSON_ID', `Productive Person ID`);

notify({ title, message: 'Starting last timer...' });

// get last time entry
const timeEntriesResp = await fetch(
  `https://api.productive.io/api/v2/time_entries?filter[person_id]=${PERSON_ID}&sort=-updated_at`,
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
const timeEntriesBody = await timeEntriesResp.json();
const timeEntryId = timeEntriesBody?.data?.[0]?.id;

if (timeEntryId) {
  const action = `Starting timer on time entry ID ${timeEntryId}...`;
  // notify(md(action));

  const resp = await fetch(
    `https://api.productive.io/api/v2/timers?time_entry_id=${timeEntryId}`,
    {
      headers: {
        'X-Auth-Token': API_KEY,
        'X-Organization-Id': ORGANIZATION_ID,
        'Content-Type': 'application/vnd.api+json',
        Accept:
          'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
      },
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'timers',
          attributes: {},
          relationships: {
            time_entry: {
              data: {
                type: 'time_entries',
                id: timeEntryId,
              },
            },
          },
        },
      }),
    }
  );

  if (resp.ok) {
    notify({
      title,
      message: `${action}

Started`,
    });
    await hide();
  } else {
    div(
      md(
        `${action}

Attempted to start timer on time entry ID ${timeEntryId}, response code: ${
          resp.status
        }
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
