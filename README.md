# Ask RESPOND Pro — Sandbox Demo

Anonymised public demo of the Ask RESPOND Pro safeguarding consultation tool.

## Purpose

This sandbox allows potential partner schools and safeguarding leads to experience Ask RESPOND Pro without access credentials. All school-specific information, staff details, and logging have been removed. Users are instructed not to enter real case information.

## Deployment

1. Push this repo to GitHub
2. Connect to Netlify (New site from Git)
3. Set the following environment variable in Netlify Dashboard > Site settings > Environment variables:

```
ANTHROPIC_API_KEY = your_anthropic_api_key_here
```

4. No build command required — deploy publishes the root directory directly.

## What's been removed from the production version

- Login / access code gate
- Google Sheets usage logging
- School-specific staff contacts (emergency panel shows national helplines only)
- TASIS England branding and logo
- Contact form (Netlify function removed)
- Pilot version banner and internal feedback email

## What's retained

- Full RESPOND system prompt (PRO v2.2)
- Priority classification system (RED / AMBER / GREEN / BLUE / GREY)
- KCSIE and Working Together document retrieval (requires doc_index.json — see note below)
- Voice input / output
- Accessibility panel
- Print and copy conversation
- Quick hide screen (Esc)

## Document index

The production version includes a pre-built `data/doc_index.json` (KCSIE 2025 and Working Together 2023 indexed for retrieval). If you have this file, place it at `data/doc_index.json` in the root. Without it, the tool operates on the system prompt alone — still fully functional.

## Framework

RESPOND Safeguarding — respondsafeguarding.org  
© 2026 RESPOND Safeguarding
