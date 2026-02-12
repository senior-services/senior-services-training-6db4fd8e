

## Remove "PPSX: Ethics" Training

### What will be deleted

The training **"PPSX: Ethics"** (ID: `5970a038-64fd-4efa-9bfb-32880627d3ea`) has:
- 2 employee assignments (jbowers, jane.doe)
- 1 video progress record (jane.doe)
- 0 quizzes

### Deletion sequence (referential integrity)

The following data operations will be run in order:

1. Delete `video_progress` for this video
2. Delete `video_assignments` for this video
3. Delete the `videos` record itself

No quiz-related cleanup is needed (no quizzes exist for this training).

### No code changes required

This is a data-only operation -- no file modifications needed.

