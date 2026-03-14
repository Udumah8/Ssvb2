# Guidelines for Working with Tasks

This document provides instructions for working with the `docs/tasks.md` checklist.

## Task Management

### Marking Tasks Complete
- Use `[x]` to mark a task as completed
- Example: `- [x] Task 1.1.1 Initialize Next.js project`
- Keep the task structure intact when marking complete

### Task Format
Each task follows this format:
```
- [ ] Task X.Y.Z Task Description - Plan: X.Y | Requirements: REQ-N
```

### Links to Requirements and Plan
- Each task is linked to a plan item (e.g., Plan: 1.1) from `docs/plan.md`
- Each task is linked to one or more requirements (e.g., Requirements: REQ-1) from `docs/requirements.md`

## Phase Organization

Tasks are organized into four phases:
1. **Phase 1:** Core Bot & solana-trade Integration
2. **Phase 2:** Web UI - Dashboard & Campaign Management
3. **Phase 3:** Real-Time Monitoring & Alerts
4. **Phase 4:** Polish & Production Readiness

## Best Practices

### Adding New Tasks
- Add new tasks to the appropriate phase section
- Use sequential numbering (e.g., Task 1.1.5 for Phase 1, task 5)
- Always link to a plan item and requirements
- Maintain consistent formatting

### Modifying Tasks
- If a task needs to be split, add new tasks and mark the original as cancelled
- If a task is no longer needed, mark it as cancelled with reason
- Keep tasks atomic and actionable

### Progress Tracking
- Check task completion during standups
- Update task status after each code review
- Track phase completion percentage

## Task States

| State | Symbol | Meaning |
|-------|--------|---------|
| Pending | `[ ]` | Not yet started |
| In Progress | `[~]` | Currently being worked on |
| Completed | `[x]` | Finished and tested |
| Cancelled | `[-]` | No longer needed |

## Workflow

1. Select a task from the current phase
2. Check the plan item for implementation details
3. Check the requirement for acceptance criteria
4. Implement the task
5. Test the implementation
6. Mark as complete with `[x]`
7. Move to next task

## Questions

If there's ambiguity in a task:
- Refer to the linked plan item in `docs/plan.md`
- Refer to the linked requirement in `docs/requirements.md`
- Check the PRD for additional context
