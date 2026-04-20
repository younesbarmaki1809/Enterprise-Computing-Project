# C3 Lab Evaluation - Individual Demonstration

Date: 2026-04-19

## 1) Exercise C3 Demonstration (PostgreSQL Partitioning)

### A. What I show live
1. The original table was preserved as `documents_old` and a partitioned parent `documents` exists.
2. Quarterly 2025 partitions exist (`documents_2025_q1` to `documents_2025_q4`).
3. Rows in Q1 date range are physically stored in `documents_2025_q1`.
4. Partition pruning is active (query on 2025-02-15 scans only Q1 partition).

### B. SQL checks used in the demo
```sql
-- Show tables
\dt

-- List child partitions
SELECT inhrelid::regclass AS partition
FROM pg_inherits
WHERE inhparent = 'documents'::regclass
ORDER BY 1;

-- Verify row routing to the right partition
SELECT tableoid::regclass AS partition, count(*) AS rows_in_partition
FROM documents
WHERE created_at BETWEEN DATE '2025-01-01' AND DATE '2025-03-31'
GROUP BY tableoid
ORDER BY 1;

-- Verify pruning
EXPLAIN ANALYZE
SELECT *
FROM documents
WHERE created_at = DATE '2025-02-15';
```

Expected evidence: execution plan shows only `documents_2025_q1` scanned.

## 2) Assignment - K6 Comparison (Same Profile)

Workload profile used: ramp to 100 concurrent users over 2 minutes posting comments.

Source script: `dms-deployment/comments-write.js`

Summary files submitted:
- `dms-deployment/k6-pg-summary.json`
- `dms-deployment/k6-cassandra-summary.json`
- `dms-deployment/k6-pg-summary.txt`
- `dms-deployment/k6-cassandra-summary.txt`

### A. Recorded results

| Backend | Throughput (req/s) | p95 Write Latency | Error Rate |
|---|---:|---:|---:|
| PostgreSQL | 447.54 | 6.77 ms | 0.00% |
| Cassandra | 448.66 | 5.99 ms | 0.00% |

### B. Required explanation paragraph

Using the same K6 write profile for both systems, both backends performed very similarly at this scale, with almost identical throughput (about 448 requests per second) and zero errors in both runs. The main difference appears in tail write latency, where Cassandra was slightly better (p95 about 5.99 ms vs 6.77 ms for PostgreSQL). This suggests that under the tested load (up to 100 concurrent users), both solutions are stable, while Cassandra has a modest advantage for write responsiveness.

### C. Required one-sentence answer

I would expect the gap to widen at several hundred to thousands of concurrent writers because Cassandra scales writes horizontally across nodes, while a single PostgreSQL instance typically reaches CPU, I/O, WAL, and lock contention limits earlier.

## 3) 60-Second Oral Script

I used the exact same K6 scenario for fairness: ramp to 100 users in 2 minutes, then ramp down, with all users posting comments. I ran it once with the PostgreSQL-backed comments service and once with the Cassandra-backed version. PostgreSQL achieved 447.54 req/s, p95 6.77 ms, and 0% errors. Cassandra achieved 448.66 req/s, p95 5.99 ms, and 0% errors. So at this load level, throughput and reliability are nearly the same, but Cassandra shows slightly better tail write latency. I expect this advantage to become more visible at higher concurrent write load because Cassandra distributes writes across nodes while PostgreSQL on one node tends to saturate sooner.