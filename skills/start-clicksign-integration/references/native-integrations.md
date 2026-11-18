# Ready-made integrations: offer them before building

Clicksign publishes a catalog of integrations at https://www.clicksign.com/integracao. Some systems a developer's code talks to already have one. When the discovery scan finds such a system, the developer decides between building the integration from scratch (this skill) and using the one that already exists. When you can ask, ask: never skip the question because building is what they asked for, and never answer it for them.

The catalog below is a snapshot taken on 2026-11-18. The catalog changes without any pull request here, so see "Confirm before you present" before telling a developer an entry exists.

## The types, as the page defines them

| Type on the page | What it is | Needs development |
|---|---|---|
| Nativa | Ready-made inside the partner's own platform, set up in that platform's interface | No |
| Conector | Built on a no-code connector platform (Pluga, n8n) that links Clicksign to the other system | No |
| Projeto | Built to order by a software consultancy that Clicksign approves, usually on the API, for a custom scenario or for a company with no developers available | Done by the consultancy |
| Via API | What this skill builds: a developer integrates directly on the Clicksign API | Yes |

## Catalog snapshot (2026-11-18)

Detail page of each entry: `https://www.clicksign.com/integracoes/` followed by the slug. Help article: the setup guide the detail page links to.

| System | Type | Segment | What its page says it does | Slug | Help article |
|---|---|---|---|---|---|
| HubSpot | Nativa | CRM | Connects with an access token, no intermediary tool. Users send documents for signature from HubSpot, follow the status in real time and open the signed documents inside HubSpot | `hubspot` | https://ajuda.clicksign.com/hubspot-e-clicksign-integracao-nativa |
| Salesforce | Nativa | CRM | Sends contracts and proposals for signature, follows the status in real time, updates fields as the status changes, generates PDFs from templates. Extendable with Flows or the API; for customization it points developers to the API documentation and teams without developers to approved partner consultancies | `salesforce` | https://ajuda.clicksign.com/como-fazer-a-integra%C3%A7%C3%A3o-da-salesforce-com-a-clicksign |
| Ploomes | Nativa | CRM | Sends proposals and documents for signature from the CRM, shows sent, viewed and signed in its Documents module, stores the signed PDF on the customer record, supports proposal templates | `ploomes` | https://ajuda.clicksign.com/integra%C3%A7%C3%A3o-ploomes-e-clicksign |
| CV CRM | Nativa | CRM, real estate | Sends documents for signature from inside CV CRM. The page text is short and does not list the flow's steps | `cv-crm` | https://ajuda.clicksign.com/como-integrar-cv-crm-e-clicksign |
| Universal Software | Nativa | CRM, real estate | Connects through digital envelopes with no intermediary tool. Users send documents for signature from the platform, follow the status and open the signed documents inside it | `universal-software` | https://ajuda.clicksign.com/como-integrar-universal-software-e-clicksign |
| PipeImob | Nativa | CRM, real estate | From a negotiation in PipeImob, generates and sends contracts for signature and follows each document's status in real time | `pipeimob` | https://ajuda.clicksign.com/integracao-pipeimob |
| Groner | Nativa | CRM, energy | The page text mostly describes the CRM for the solar sector and says little about the signing flow | `groner` | https://ajuda.clicksign.com/integra%C3%A7%C3%A3o-groner-e-clicksign- |
| Netlex | Nativa | CLM | Adds e-signature to the contracts the platform generates: configure signature flows, generate documents, send them for signature and follow the flow in one place | `netlex` | https://ajuda.clicksign.com/integracao-clicksign-e-netlex |
| SoftExpert | Nativa | ECM | Sends documents registered in its Document module for signature, with the signature type set on the document category. The signed PDF stays stored and linked to the original record, with the history of sending, viewing and signing | `softexpert` | https://ajuda.clicksign.com/como-fazer-a-integra%C3%A7%C3%A3o-entre-a-softexpert-e-a-clicksign |
| n8n | Nativa | Automation | Automates signature steps, from sending documents to following them up, inside n8n workflows. The page lists it as Nativa, but its own FAQ groups n8n with the connectors: treat it as no-code | `n8n` | https://ajuda.clicksign.com/integra%C3%A7%C3%A3o-n8n-e-clicksign |
| Pluga | Conector | General | A connector platform with more than 100 options, linking Clicksign to other tools without code | `pluga` | https://ajuda.clicksign.com/como-fazer-a-integracao-entre-a-pluga-e-a-clicksign |
| Agendor | Conector | CRM | Through Pluga: sends a document for signature when a deal reaches a stage, and creates or updates a deal when a document is finished | `agendor` | https://ajuda.clicksign.com/como-fazer-a-integracao-entre-a-pluga-e-a-clicksign |
| Pipefy | Conector | CRM | Through Pluga: when a document is signed in Clicksign, creates a card in Pipefy. The page describes only this direction | `pipefy` | https://ajuda.clicksign.com/integra%C3%A7%C3%A3o-clicksign-e-pipefy-via-pluga |
| RD Station CRM | Conector | CRM | Through Pluga: when a document is signed in Clicksign, creates or updates a deal. The page describes only this direction | `rd-station-crm` | https://ajuda.clicksign.com/integra%C3%A7%C3%A3o-rd-station-e-clicksign-via-pluga |
| TOTVS Protheus | Projeto | ERP | Built to order by approved consultancies: custom e-signature on documents Protheus generates, with sending, status and signed documents inside Protheus. The scope is agreed with the consultancy | `totvs-protheus` | https://ajuda.clicksign.com/integracao-totvs-protheus |

Claude, ChatGPT, Codex and Cursor also appear in the catalog. They are AI assistants, the channels this skill itself runs in, not systems a developer's code connects to. Never offer one of them as an alternative.

## Finding the system in the code

Look for the system's name in the places discovery already reads: dependency manifests, SDK imports, API hosts, configuration key names, exported workflow files. A few signs are specific enough to trust on their own:

| System | Strong sign |
|---|---|
| HubSpot | The official HubSpot client library, `api.hubapi.com`, `HUBSPOT_*` configuration keys, `dealstage` |
| Salesforce | `jsforce`, `simple-salesforce` or `restforce`, Apex classes or triggers, `sfdx-project.json` |
| Pipefy | `api.pipefy.com`, `PIPEFY_*` configuration keys |
| n8n | Exported workflow files with `n8n-nodes-base` node types, the `n8nio/n8n` container image |
| TOTVS Protheus | ADVPL or TLPP source files (`.prw`, `.prx`, `.tlpp`) |

For the others, the name in a dependency, host, configuration key or file name is the sign. A sign is a hint, not proof: name the system in the discovery summary, so the developer corrects a wrong match.

A system counts only when it is where the contract or document lives, or where the send is triggered, per the "Contract or document entity" and "Trigger point" rows in [discovery.md](discovery.md). A catalog system the code touches for something unrelated does not count.

A system that is not in the table (a bespoke or internal system, a spreadsheet, any product the catalog does not list) raises no question. Continue with the default flow, and do not suggest the catalog has anything for it.

## Confirm before you present

Fetch the matched entry's detail page once, not the whole catalog, to confirm it is still listed and to read its type. The page disagrees with this table when the entry is gone, its type changed, or it is marked "Em breve"; a different segment label does not count. When it disagrees, trust the live page and say so. An entry marked "Em breve" is announced, not available: do not offer it. Use the help article link from this table; if the fetched page shows a different one, use the page's. If the fetch fails or is denied, present from this table and say it is a snapshot from 2026-11-18.

## Ask once, before anything else

Right after the discovery summary, before any decision or business question, and alone: the answer can make every other question moot. Send the summary and the question in the same message, so the developer can correct a wrong match in the same reply; if the correction removes the match, drop the question. If several catalog systems matched, ask once and list them all.

Skip the question, and the page fetch, when the repository already holds a Clicksign integration on the API 3.0 (either sign is enough: calls under `/api/v3`, or a Clicksign access token key in the configuration): that choice was already made. Say in the discovery summary that you found it.

Give the developer, in their own language:

1. The system and the type, in the page's own words (Nativa, Conector or Projeto).
2. What the page says it does, taken from the entry's descriptive paragraph on the live page when you fetched it, otherwise from the table above, never from benefit headlines, and without adding capabilities the page does not state.
3. What that means for them: Nativa and Conector need no development from their side; Projeto is built by an approved consultancy.
4. What the page does not say, always: whether it covers the developer's own trigger, fields and rules. If the entry only describes the signed-to-CRM direction (Pipefy, RD Station CRM), say it does not describe sending documents for signature.
5. The link to the entry's detail page.

Then the question, with two options and the host's native question tool when available: build the integration from scratch on the API 3.0, in the developer's own code (the suggested default: it is what they asked for), or follow the ready-made integration and stop here.

A read-only session can still ask: ask as usual. Only when nobody can answer (no question tool and no way to wait for a reply), do not answer for them either: proceed on what they asked for, which is building, and put the ready-made option at the very top of the report (or of the proposal, in a read-only session), so the choice stays theirs.

## After the answer

**From scratch.** Continue with the workflow. In the report, say which ready-made integration was offered and that the developer chose to build.

**Ready-made.** Write no code and touch no file. Hand over:

- the detail page and the help article from the table, as the place where setup starts;
- one line saying the setup steps live in that article, and that this skill has not checked them;
- for a Projeto entry, that the next step is to contact an approved consultancy through the detail page, and for Salesforce, the same page for a team without developers;
- that building from scratch stays available: if the ready-made option turns out not to cover the case, ask again and this skill resumes from the discovery summary.

Do not configure the other platform, do not generate a token for it, and do not add the "Only you can do this" block: nothing was built here.
