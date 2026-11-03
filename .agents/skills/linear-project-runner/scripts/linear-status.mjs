#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/^LINEAR_API_KEY=(.+)$/m);
if (!match) {
  console.error('LINEAR_API_KEY not found in .env.local');
  process.exit(1);
}
const apiKey = match[1].trim().replace(/^["']|["']$/g, '');

async function linearQuery(query, variables = {}) {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

const TEAM_ID = '87230301-3298-43dd-98bc-46d634070190';

async function main() {
  const [, , action, ...args] = process.argv;

  if (!action || action === 'list') {
    const data = await linearQuery(
      `
      query($teamId: String!) {
        team(id: $teamId) {
          issues(first: 100) {
            nodes {
              identifier
              title
              state {
                name
              }
            }
          }
        }
      }
    `,
      { teamId: TEAM_ID }
    );
    for (const issue of data.team.issues.nodes) {
      console.log(`${issue.identifier} [${issue.state.name}] - ${issue.title}`);
    }
    return;
  }

  let comment = null;
  let identifiers = [];
  let targetStateType = 'started';

  if (action === 'start') {
    targetStateType = 'started';
    identifiers = args;
  } else if (action === 'done') {
    targetStateType = 'completed';
    comment = args[0];
    identifiers = args.slice(1);
  } else {
    console.error('Usage: linear-status.mjs [list | start PRO-5 ... | done "comment" PRO-5 ...]');
    process.exit(1);
  }

  const stateData = await linearQuery(
    `
    query($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes {
            id
            name
            type
          }
        }
        issues(first: 100) {
          nodes {
            id
            identifier
            title
          }
        }
      }
    }
  `,
    { teamId: TEAM_ID }
  );

  const targetState = stateData.team.states.nodes.find((s) => s.type === targetStateType);
  if (!targetState) {
    throw new Error(`Could not find workflow state for type: ${targetStateType}`);
  }

  for (const ident of identifiers) {
    const issue = stateData.team.issues.nodes.find(
      (i) => i.identifier.toUpperCase() === ident.toUpperCase()
    );
    if (!issue) {
      console.warn(`Issue ${ident} not found`);
      continue;
    }

    await linearQuery(
      `
      mutation($id: String!, $stateId: String!) {
        issueUpdate(id: $id, input: { stateId: $stateId }) {
          success
        }
      }
    `,
      { id: issue.id, stateId: targetState.id }
    );
    console.log(`Updated ${issue.identifier} -> ${targetState.name}`);

    if (comment) {
      await linearQuery(
        `
        mutation($issueId: String!, $body: String!) {
          commentCreate(input: { issueId: $issueId, body: $body }) {
            success
          }
        }
      `,
        { issueId: issue.id, body: comment }
      );
      console.log(`Added comment to ${issue.identifier}`);
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

