# Queueing and Execution Architecture

This document outlines how the job queueing, execution, cancellation, and resume mechanisms work. It summarizes the cross-worker guarantees driven by the database and the local bookkeeping that exists only within a single worker process.

## Key entities
- **Job**: persisted with fields including `status`, `lease_owner`, `lease_expires_at`, and `cancel_requested`.
  - `status ∈ {PENDING, QUEUED, RUNNING, PAUSED, ERROR, SUCCESS, CANCELED}`.
- **Worker**: an async loop per tenant that claims jobs, runs them, and maintains a heartbeat lease.
- **Lease**: database-backed ownership via `lease_owner` and `lease_expires_at` to ensure a single worker executes a job and to detect stale workers.

Relevant code:
- `server/utils/job_execution.py`
- `server/database/service.py`
- `server/routes/jobs.py`

## Queueing and claim (cross-worker safe)
- Jobs are created and moved to `QUEUED` by `enqueue_job`.
- `claim_next_job(tenant_schema)` in `server/database/service.py`:
  - Picks the oldest `QUEUED` job such that the target has no `RUNNING` job and no `PAUSED`/`ERROR` jobs (these pause the target queue).
  - Sets `status = RUNNING`, assigns `lease_owner = WORKER_ID`, sets `lease_expires_at = now + lease`, and clears `cancel_requested = False` to avoid stale cancellations.
  - Uses an advisory transaction lock per target and `FOR UPDATE SKIP LOCKED` to guarantee single-claim across workers.

## Execution and heartbeat
- For each claimed job, the worker starts two asyncio tasks (in `server/utils/job_execution.py`):
  - The execution task: `execute_api_in_background_with_tenant(job, tenant_schema)`.
  - The lease heartbeat task: `_lease_heartbeat(job, tenant_schema, exec_task)`.
- Heartbeat runs every 2s:
  - Renews the lease (`renew_job_lease`).
  - Checks `cancel_requested` in DB; if true, cancels the execution task (`exec_task.cancel()`), then exits.

## Cancellation semantics (cross-worker)
- Any process can call `request_job_cancel(job_id)` → sets `cancel_requested = True` in DB.
- The worker owning the job will observe this via the heartbeat and cancel the execution task.
- In the execution code, on `asyncio.CancelledError`:
  - If token usage `<= TOKEN_LIMIT`: the job is marked `PAUSED`, `cancel_requested = False`, with message "Job was interrupted by user".
  - If token usage `> TOKEN_LIMIT`: the job is marked `ERROR`, `cancel_requested = False`, with message about token limit.

## Stale worker protection
- `expire_stale_running_jobs()` marks `RUNNING` jobs as `ERROR` when `lease_expires_at < now` or a lease is otherwise invalid, ensuring the system recovers from worker failures.

## Resume flow
- `POST /targets/{target_id}/jobs/{job_id}/resume/` allows resuming a `PAUSED` or `ERROR` job.
- Resume sets the job to `QUEUED`. On the next claim, `cancel_requested` is cleared and a fresh lease is established, enabling clean re-execution.

## In-memory vs cross-worker guarantees
- `running_job_tasks` in `server/utils/job_execution.py` is a per-process dict mapping `job_id → asyncio.Task` for local bookkeeping only. It is not used for coordination.
- All cross-worker guarantees are enforced by the database via job `status`, leases (`lease_owner`, `lease_expires_at`), and the `cancel_requested` flag.

## State diagram
```mermaid
stateDiagram-v2
  direction LR
  ["queue"] --> QUEUED: create/enqueue
  QUEUED --> RUNNING: claim_next_job\n(no RUNNING or PAUSED/ERROR for target)\nset lease_owner, lease_expires_at\nreset cancel_requested=false
  RUNNING --> RUNNING: _lease_heartbeat\nrenew_job_lease
  RUNNING --> PAUSED: cancel_requested=true\n(user interrupt)
  RUNNING --> ERROR: token limit exceeded\nor unexpected exception
  RUNNING --> ERROR: lease expired\nexpire_stale_running_jobs
  PAUSED --> QUEUED: POST /jobs/{id}/resume
  ERROR --> QUEUED: POST /jobs/{id}/resume
```

## Operational notes
- A `PAUSED` or `ERROR` job blocks further jobs for that target from being claimed (target queue pause). Clearing/Resolving or Resuming allows the queue to continue.
