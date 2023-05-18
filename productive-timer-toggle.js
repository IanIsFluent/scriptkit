// @ts-check
// Name: Productive Timer Toggle
// Description: Starts or stops a timer in Productive
//
import { ResponseParser } from './ResponseParser.js';

// You can find it in Accounts & Settings -> API access -> Generate new token (READ / WRITE)
const API_KEY = await env('PRODUCTIVE_API_KEY', `Productive API key`);

// You can find it in Accounts & Settings -> API access -> Organization ID
const ORGANIZATION_ID = await env(
  'PRODUCTIVE_ORGANIZATION_ID',
  `Productive Organization ID`
);

// You can find it by going to Accounts & Settings -> Your Name, then look in the URL bar https://app.productive.io/{ORGANIZATION-ID}-{ORGANIZATION-NAME}/people/{PERSON_ID}/overview
const PERSON_ID = await env('PRODUCTIVE_PERSON_ID', `Productive Person ID`);

const chosenEntry = await arg('Select time entry', async () =>
  // todo: error handling and env vars
  (
    await getTimeEntriesVMFromApi()
  ).map((entry) => {
    const spacePlayIfRunning = entry.startedAt ? ' ▶️' : '';
    const currentTime = getCurrentTime(entry);
    return {
      name: `${entry.deal} - ${entry.service} (${entry.date}) ${currentTime}${spacePlayIfRunning}`,
      description: entry.note,
      value: entry,
    };
  })
);

const action = `${chosenEntry.startedAt ? 'Stopping' : 'Starting'} ${
  chosenEntry.id
} (${chosenEntry.deal} - ${chosenEntry.service})...`;
div(md(action));

async function getTimeEntriesVMFromApi() {
  const res = await fetch(
    `https://api.productive.io/api/v2/time_entries?sort=-date&filter[person_id]=${PERSON_ID}`,
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

  const body = await res.json();
  const parser = new ResponseParser(body);
  const timeEntriesVM = parser.mapResponseToVM();
  return timeEntriesVM;
}

function getCurrentTime(entry) {
  return entry.startedAt
    ? `${timeMSToHHMM(
        new Date().getTime() -
          new Date(entry.startedAt).getTime() +
          timeMinsToMS(entry.time)
      )}`
    : timeMinsToHHMM(entry.time);
}

function timeMSToHHMM(timeInMs) {
  const mins = Math.round(timeInMs / 1000 / 60);
  const hrs = Math.floor(mins / 60);
  const leftOverMins = mins - hrs * 60;
  return `${hrs}:${leftOverMins}`;
}

function timeMinsToMS(timeInMins) {
  return timeInMins * 60 * 1000;
}

function timeMinsToHHMM(timeInMins) {
  const hrs = Math.floor(timeInMins / 60);
  const leftOverMins = timeInMins - hrs * 60;
  return `${hrs}:${leftOverMins}`;
}

if (chosenEntry.startedAt) {
  const stopResp = await fetch(
    `https://api.productive.io/api/v2/timers?filter[person_id]=${PERSON_ID}&filter[time_entry_id]=${chosenEntry.id}&filter[stopped_at]=`,
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

  const stoppingAction = `${action}

  Stopping timer id ${timerId}...`;
  div(md(stoppingAction));

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
    div(
      md(`${stoppingAction}

Stopped`)
    );
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
  const startResp = await fetch(
    `https://api.productive.io/api/v2/timers?time_entry_id=${chosenEntry.id}`,
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
                id: chosenEntry.id,
              },
            },
          },
        },
      }),
    }
  );

  if (startResp.ok) {
    div(
      md(`${action}

Started`)
    );
  } else {
    div(
      md(
        `Attempted to start timer ${chosenEntry.id}, response code: ${
          startResp.status
        }
      \`\`\`
      ${JSON.stringify(startResp.body)}
      \`\`\``
      )
    );
  }
}
