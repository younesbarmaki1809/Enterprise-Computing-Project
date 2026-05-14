# Translator Service (C3)

This service consumes `dms.documents.uploaded`, calls Gemini for translation, and publishes to `dms.documents.translated`.

## Architecture Rule
The translator **must not call the Documents service directly**. It only talks to Kafka and Gemini.

Why direct DMS calls are a regression:
- It reintroduces tight runtime coupling between services.
- DMS outages would block translation processing immediately.
- It breaks asynchronous event-driven boundaries and makes retry/error handling cross-service.
- It causes hidden write side effects in a consumer that should be single-responsibility.

## Run
1. Ensure Kafka stack is up and network `backend_default` exists.
2. Export your Gemini key in host shell:
   - PowerShell: `$env:GEMINI_API_KEY="<your-key>"`
3. Start service:
   - `docker compose -f translator-service/docker-compose.yml up -d --build`

## Topics
- Input: `dms.documents.uploaded`
- Output: `dms.documents.translated`
- Consumer group: `translator-service`

## Offset Commit Strategy
- `enable_auto_commit=false` (manual commit).
- Commit happens **only after**:
  1. Gemini call succeeds.
  2. Publish to `dms.documents.translated` succeeds.
- Reason: prevents marking a message consumed before producing the downstream result.

## auto.offset.reset Choice
- `earliest` is used.
- Reason: if group offsets are missing (fresh deployment), translator can process backlog instead of silently skipping historical upload events.

## Gemini Key Handling
- Stored in environment variable `GEMINI_API_KEY`.
- Never baked into Docker image because images are shareable/artifacts and can leak secrets through registry/history.

## Gemini Unreachable Behavior
- Retry with bounded backoff (`GEMINI_MAX_RETRIES`, `GEMINI_RETRY_BACKOFF_SECONDS`).
- After retries, service fails loudly (process exits) and offset is not committed.
- This avoids silent data loss and lets orchestrator restart the consumer.
