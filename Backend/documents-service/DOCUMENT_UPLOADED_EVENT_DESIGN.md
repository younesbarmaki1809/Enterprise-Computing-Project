# DocumentUploaded Event Design

## Topic
- `dms.documents.uploaded`
- Partitions: `3`

## Event Payload
The event payload includes fields that let downstream services react without calling back to the Documents API:
- `eventId`: unique ID for tracing and de-duplication.
- `eventType`: explicit semantic type (`DocumentUploaded`).
- `occurredAt`: event creation timestamp.
- `documentId`: stable domain identifier.
- `title`: user/business context.
- `fileName`: original uploaded name for display/processing decisions.
- `fileKey`: object key in storage; required to fetch/process content.
- `contentType`: processing route hint (for example PDF vs image).
- `fileSize`: helps validation, batching, and policy checks.
- `storageBucket`: tells consumers where the object is stored.

## Deliberately Left Out
- Raw file bytes: too large for Kafka messages and duplicates object storage.
- Pre-signed URLs: short-lived and environment-dependent; not reliable for async consumers.
- Internal DB/cache details: not needed by consumers and increases coupling.
- Comments/document aggregate data from other services: unrelated to upload action.

## Message Key Choice
- Key: `documentId` (as string).
- Why:
  - All events for the same document are routed to the same partition.
  - Consumers get per-document ordering guarantees.
  - Partitions still distribute well across many document IDs.
