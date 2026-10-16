<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class TaskAttachmentService
{
    public function __construct(
        protected TaskAuthorization $authorization,
        protected ProjectService $projectService,
    ) {}

    /**
     * Upload multiple attachments to a task.
     *
     * Only the task creator, current assignees or a Super Admin
     * may upload attachments.
     *
     * @param UploadedFile[] $files
     * @return TaskAttachment[]
     */
    public function upload(
        User $actor,
        Task $task,
        array $files,
    ): array {
        $this->assertCanManageAttachments($actor, $task);

        $disk = Storage::disk('private');
        $storedPaths = [];

        try {
            return DB::transaction(function () use (
                $actor,
                $task,
                $files,
                $disk,
                &$storedPaths,
            ) {
                $attachments = [];

                foreach ($files as $file) {
                    if (
                        ! $file instanceof UploadedFile ||
                        ! $file->isValid()
                    ) {
                        throw ValidationException::withMessages([
                            'files' => 'One or more uploaded files are invalid.',
                        ]);
                    }

                    $path = $file->store(
                        "task-attachments/{$task->id}",
                        'private',
                    );

                    if (! $path) {
                        throw new \RuntimeException(
                            'The attachment could not be stored.'
                        );
                    }

                    $storedPaths[] = $path;

                    $attachments[] = $task->attachments()->create([
                        'uploaded_by' => $actor->id,

                        'original_name' => $this->safeOriginalName(
                            $file->getClientOriginalName()
                        ),

                        'disk' => 'private',
                        'path' => $path,

                        'mime_type' => $file->getMimeType()
                            ?: 'application/octet-stream',

                        'size' => $file->getSize(),
                    ]);
                }

                return $attachments;
            });
        } catch (Throwable $exception) {
            // Clean up stored files if the database operation fails.
            foreach ($storedPaths as $path) {
                try {
                    $disk->delete($path);
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        }
    }

    /**
     * Delete one attachment belonging to the specified task.
     *
     * Only the task creator, current assignees or a Super Admin
     * may delete attachments.
     */
    public function delete(
        User $actor,
        Task $task,
        TaskAttachment $attachment,
    ): void {
        $this->assertAttachmentBelongsToTask($task, $attachment);

        $this->assertCanManageAttachments($actor, $task);

        DB::transaction(function () use ($task, $attachment) {
            $lockedAttachment = $task->attachments()
                ->whereKey($attachment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $disk = Storage::disk($lockedAttachment->disk);

            if ($disk->exists($lockedAttachment->path)) {
                $deleted = $disk->delete(
                    $lockedAttachment->path
                );

                if (! $deleted) {
                    throw new \RuntimeException(
                        'The attachment file could not be deleted.'
                    );
                }
            }

            $lockedAttachment->delete();
        });
    }

    /**
     * Ensure the attachment belongs to the supplied task.
     */
    public function assertAttachmentBelongsToTask(
        Task $task,
        TaskAttachment $attachment,
    ): void {
        abort_unless(
            (int) $attachment->task_id === (int) $task->id,
            404,
        );
    }

    /**
     * Check existing task permissions and project/task editability.
     */
    protected function assertCanManageAttachments(
        User $actor,
        Task $task,
    ): void {
        $task->loadMissing('project');

        // Creator, current assignee or Super Admin.
        $this->authorization->assertCanManage(
            $actor,
            $task,
        );

        // Completed or archived projects cannot be modified.
        $this->projectService->assertEditable(
            $task->project
        );

        // Archived tasks cannot be modified.
        if ($task->isArchived()) {
            throw ValidationException::withMessages([
                'task' => 'Archived tasks cannot be modified. Restore the task first.',
            ]);
        }
    }

    /**
     * Remove path components and control characters from the display name.
     */
    protected function safeOriginalName(string $name): string
    {
        $name = str_replace('\\', '/', $name);
        $name = basename($name);

        $name = preg_replace(
            '/[\x00-\x1F\x7F]/u',
            '',
            $name,
        ) ?? '';

        $name = trim($name);

        if (
            $name === '' ||
            $name === '.' ||
            $name === '..'
        ) {
            return 'attachment';
        }

        return mb_substr($name, 0, 255);
    }
}