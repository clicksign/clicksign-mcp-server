import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matches, mentionedOperations, normalizePath, operationsFromOpenApi } from '../scripts/check-endpoints.mjs';

describe('normalizePath', () => {
  it('strips the base URL and the /api/v3 prefix', () => {
    assert.equal(normalizePath('{{BASE_URL}}/api/v3/envelopes'), '/envelopes');
    assert.equal(normalizePath('/api/v3/envelopes'), '/envelopes');
  });

  it('collapses every param segment to {}, regardless of its name or brace style', () => {
    assert.equal(normalizePath('/envelopes/{envelope_id}/documents/{document_id}'), '/envelopes/{}/documents/{}');
    assert.equal(normalizePath('{{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/signers'), '/envelopes/{}/signers');
  });

  it('drops a query string and trailing punctuation', () => {
    assert.equal(normalizePath('/envelopes/{id}/events?filter[name]=signature_started'), '/envelopes/{}/events');
    assert.equal(normalizePath('/webhooks,'), '/webhooks');
  });
});

describe('mentionedOperations', () => {
  it('extracts a full METHOD + path mention', () => {
    const ops = mentionedOperations('POST {{BASE_URL}}/api/v3/envelopes/{{envelope_id}}/documents\n');
    assert.deepEqual(ops, [{ method: 'POST', path: '/envelopes/{}/documents' }]);
  });

  it('extracts a `...` shorthand as a suffix', () => {
    const ops = mentionedOperations('send it in one `POST .../bulk_requirements` call');
    assert.deepEqual(ops, [{ method: 'POST', suffix: '/bulk_requirements' }]);
  });

  it('ignores a legacy-API mention entirely', () => {
    assert.deepEqual(mentionedOperations('Call POST /api/v1/documents to send.'), []);
  });

  it('ignores an unrelated METHOD + URL that is not a known v3 resource, such as a webhook endpoint example', () => {
    const text = '"endpoint": "https://example.com/webhooks/clicksign"';
    // no HTTP verb immediately precedes the URL, so nothing is extracted
    assert.deepEqual(mentionedOperations(text), []);
  });

  it('skips a mentioned path whose first segment is not a known v3 resource', () => {
    assert.deepEqual(mentionedOperations('GET /something/else'), []);
  });
});

describe('operationsFromOpenApi', () => {
  it('extracts every HTTP method declared for every path', () => {
    const markdown = [
      '# Title',
      '',
      '```json',
      JSON.stringify({
        paths: {
          '/envelopes/{envelope_id}/documents': { get: {}, post: {} },
          '/envelopes/{envelope_id}': { patch: {} },
        },
      }),
      '```',
    ].join('\n');
    const ops = operationsFromOpenApi(markdown);
    assert.deepEqual(
      ops.sort((a, b) => a.method.localeCompare(b.method)),
      [
        { method: 'GET', path: '/envelopes/{}/documents' },
        { method: 'PATCH', path: '/envelopes/{}' },
        { method: 'POST', path: '/envelopes/{}/documents' },
      ].sort((a, b) => a.method.localeCompare(b.method)),
    );
  });

  it('returns nothing for a page with no OpenAPI block', () => {
    assert.deepEqual(operationsFromOpenApi('# Overview\n\nJust links, no spec.\n'), []);
  });

  it('returns nothing for an unparsable block instead of throwing', () => {
    assert.deepEqual(operationsFromOpenApi('```json\nnot json\n```'), []);
  });
});

describe('matches', () => {
  const known = new Set(['POST /envelopes/{}/bulk_requirements', 'GET /envelopes/{}/documents']);

  it('matches a full path exactly', () => {
    assert.ok(matches({ method: 'GET', path: '/envelopes/{}/documents' }, known));
    assert.ok(!matches({ method: 'GET', path: '/envelopes/{}/signers' }, known));
  });

  it('matches a `...` suffix against any known path ending with it, same method', () => {
    assert.ok(matches({ method: 'POST', suffix: '/bulk_requirements' }, known));
    assert.ok(!matches({ method: 'GET', suffix: '/bulk_requirements' }, known));
    assert.ok(!matches({ method: 'POST', suffix: '/documents' }, known));
  });
});
