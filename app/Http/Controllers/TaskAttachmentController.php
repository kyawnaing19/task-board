<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\StoreTaskAttachmentRequest;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Services\TaskAttachmentService;
use App\Services\TaskAuthorization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TaskAttachmentController extends Controller
{
    public function __construct(
        protected TaskAttachmentService $service,
        protected TaskAuthorization $authorization,
    ) {}

    /**
     * List attachments.
     *
     * Any member who can view the project may view its task attachments.
     */
    public function index(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskView($request, $task);

        $attachments = $task->attachments()
            ->with('uploader:id,name')
            ->latest()
            ->get()
            ->map(fn (TaskAttachment $attachment) => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'uploaded_at' => $attachment->created_at?->toISOString(),

                'uploader' => $attachment->uploader
                    ? [
                        'id' => $attachment->uploader->id,
                        'name' => $attachment->uploader->name,
                    ]
                    : null,

                'download_url' => route(
                    'tasks.attachments.download',
                    [$task, $attachment],
                ),

                'preview_url' => in_array(
                    strtolower($attachment->mime_type),
                    [
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                        'image/gif',
                    ],
                    true,
                )
                    ? route(
                        'tasks.attachments.preview',
                        [$task, $attachment],
                    )
                    : null,
            ]);

        return response()->json([
            'attachments' => $attachments,
        ]);
    }

    /**
     * Upload attachments.
     *
     * Authorization is enforced by TaskAttachmentService.
     */
    public function store(
        StoreTaskAttachmentRequest $request,
        Task $task,
    ): JsonResponse {
        $uploaded = $this->service->upload(
            $request->user(),
            $task,
            $request->file('files', []),
        );

        $uploadedIds = collect($uploaded)
            ->pluck('id')
            ->all();

        $attachments = $task->attachments()
            ->whereIn('id', $uploadedIds)
            ->with('uploader:id,name')
            ->latest()
            ->get()
            ->map(fn (TaskAttachment $attachment) => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'uploaded_at' => $attachment->created_at?->toISOString(),

                'uploader' => $attachment->uploader
                    ? [
                        'id' => $attachment->uploader->id,
                        'name' => $attachment->uploader->name,
                    ]
                    : null,

                'download_url' => route(
                    'tasks.attachments.download',
                    [$task, $attachment],
                ),

                'preview_url' => in_array(
                    strtolower($attachment->mime_type),
                    [
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                        'image/gif',
                    ],
                    true,
                )
                    ? route(
                        'tasks.attachments.preview',
                        [$task, $attachment],
                    )
                    : null,
            ])
            ->values();

        return response()->json([
            'message' => 'Attachments uploaded successfully.',
            'attachments' => $attachments,
        ], 201);
    }

    /**
     * Download an attachment.
     *
     * Any member who can view the project may download it.
     */
    public function download(
        Request $request,
        Task $task,
        TaskAttachment $attachment,
    ) {
        $this->assertAttachmentViewAccess(
            $request,
            $task,
            $attachment,
        );

        $disk = Storage::disk($attachment->disk);

        abort_unless($disk->exists($attachment->path), 404);

        $filePath = $disk->path($attachment->path);

        abort_unless(is_file($filePath), 404);

        return response()->download(
            $filePath,
            $attachment->original_name,
            [
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ],
        );
    }

    /**
     * Preview supported raster images inline.
     *
     * Any member who can view the project may preview them.
     */
    public function preview(
        Request $request,
        Task $task,
        TaskAttachment $attachment,
    ) {
        $this->assertAttachmentViewAccess(
            $request,
            $task,
            $attachment,
        );

        $allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
        ];

        abort_unless(
            in_array(
                strtolower($attachment->mime_type),
                $allowedTypes,
                true,
            ),
            404,
        );

        $disk = Storage::disk($attachment->disk);

        abort_unless($disk->exists($attachment->path), 404);

        $filePath = $disk->path($attachment->path);

        abort_unless(is_file($filePath), 404);

        return response()->file(
            $filePath,
            [
                'Content-Type' => strtolower($attachment->mime_type),
                'Content-Disposition' => 'inline',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ],
        );
    }

    /**
     * Delete an attachment.
     *
     * Only the task creator, current assignees or a Super Admin
     * may delete it, subject to project/task editability rules.
     */
    public function destroy(
        Request $request,
        Task $task,
        TaskAttachment $attachment,
    ): JsonResponse {
        $this->service->delete(
            $request->user(),
            $task,
            $attachment,
        );

        return response()->json([
            'message' => 'Attachment deleted successfully.',
        ]);
    }

    /**
     * Authorize viewing attachments through project membership.
     */
    protected function authorizeTaskView(
        Request $request,
        Task $task,
    ): void {
        abort_unless($request->user(), 401);

        $task->loadMissing('project');

        $this->authorization->assertCanView(
            $request->user(),
            $task->project,
        );
    }

    /**
     * Verify project access and ensure the attachment belongs to this task.
     */
    protected function assertAttachmentViewAccess(
        Request $request,
        Task $task,
        TaskAttachment $attachment,
    ): void {
        $this->authorizeTaskView($request, $task);

        abort_unless(
            (int) $attachment->task_id === (int) $task->id,
            404,
        );
    }
}