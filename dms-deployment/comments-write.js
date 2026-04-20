import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
  },
};

export default function () {
  const docId = Number(__ENV.DOC_ID || 5);
  const payload = JSON.stringify({
    docId,
    content: `k6 write ${__VU}-${__ITER}`,
    author: 'k6',
  });

  const res = http.post(__ENV.TARGET, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { op: 'write' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
