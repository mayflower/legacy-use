# One Active Session Per Target - Implementation Summary

## Overview

Implemented a constraint to enforce that only one active (non-archived) session can exist per target at any time. This prevents session interference and improves system reliability.

## Backend Changes

### 1. Database Service Enhancement

**File:** `server/database/service.py`

Added new method `has_active_session_for_target()`:
- Checks for any non-archived sessions for a given target
- Returns both a boolean flag and session details if found
- Handles errors gracefully with logging

### 2. Session Creation Route Update

**File:** `server/routes/sessions.py`

Modified the `create_session()` endpoint:
- Added validation to check for existing active sessions before creation
- Returns HTTP 409 (Conflict) with detailed error information if active session exists
- Bypass constraint when `get_or_create=True` parameter is used (for existing functionality)
- Provides information about the existing session in the error response

## Frontend Changes

### 1. Enhanced Error Handling

**File:** `app/components/CreateSession.jsx`

Updated session creation error handling:
- Detects HTTP 409 responses specifically for session conflicts
- Displays detailed information about the existing active session
- Provides options to:
  - View details of the existing session
  - Navigate directly to the existing session
  - Archive the existing session first

## Key Features

### ✅ Constraint Enforcement
- Only one active (non-archived) session per target
- Archived sessions do not count toward the limit
- Clear error messages when constraint is violated

### ✅ User Experience
- Informative error messages with existing session details
- Quick navigation to existing sessions
- Clear instructions on how to resolve conflicts

### ✅ Backward Compatibility
- Existing `get_or_create=True` functionality preserved
- No breaking changes to current workflows

## Error Response Format

When attempting to create a session for a target that already has an active session:

```json
{
  "status_code": 409,
  "detail": {
    "message": "An active session already exists for this target",
    "existing_session": {
      "id": "session-uuid",
      "name": "Session Name",
      "state": "ready",
      "status": "running",
      "created_at": "2024-01-01T12:00:00Z"
    }
  }
}
```

## Testing Scenarios

The implementation handles these scenarios correctly:

1. **First session creation** → ✅ Succeeds
2. **Second session creation for same target** → ❌ Blocked with helpful error
3. **Session creation after archiving** → ✅ Succeeds
4. **Session creation with get_or_create=True** → ✅ Returns existing or creates new

## Benefits

- **Prevents interference** between multiple sessions on the same target
- **Improves reliability** by avoiding resource conflicts
- **Clear user feedback** about why session creation failed
- **Easy resolution** with direct links to existing sessions
- **Maintains compatibility** with existing workflows