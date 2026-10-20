<?php

namespace App\Services;

use App\Enums\UserStatus;
use App\Models\User;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmployeeService
{
    public const TEMP_PASSWORD_HOURS = 24;

    public function __construct(
        protected EmployeeRepositoryInterface $employees,
        protected FileUploadService $fileUploadService,
    ) {}

    /**
     * Create a new employee.
     *
     * Upload the avatar through FileUploadService.
     */
    public function create(
        array $data,
        ?UploadedFile $avatar = null,
    ): array {
        $storedAvatar = null;

        try {
            if ($avatar) {
                $storedAvatar = $this->fileUploadService->upload(
                    $avatar,
                    'avatars',
                    config('uploads.avatar_disk', 'public'),
                );
            }

            $tempPassword = $this->generateTempPassword();

            $user = $this->employees->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'job_title' => $data['job_title'] ?? null,
                'role' => $data['role'],
                'status' => UserStatus::ACTIVE->value,
                'password' => $tempPassword,
                'must_change_password' => true,
                'password_expires_at' => now()->addHours(
                    self::TEMP_PASSWORD_HOURS
                ),
                'email_verified_at' => now(),

                'avatar_path' => $storedAvatar['path'] ?? null,
                'avatar_disk' => $storedAvatar['disk'] ?? null,

                'dashboard_assignments_seen_at' => now(),
            ]);

            return [$user, $tempPassword];
        } catch (Throwable $exception) {
            if ($storedAvatar) {
                try {
                    $this->fileUploadService->delete(
                        $storedAvatar['path'],
                        $storedAvatar['disk'],
                    );
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        }
    }

    /**
     * Show employee details.
     */
    public function showDetail(User $user)
    {
        return $this->employees->showDetail($user);
    }

    /**
     * Update employee information and avatar.
     */
    public function update(
        User $user,
        array $data,
        ?UploadedFile $avatar = null,
        bool $removeAvatar = false,
    ): User {
        $attributes = Arr::only(
            $data,
            ['name', 'email', 'job_title']
        );

        $oldAvatarPath = $user->avatar_path;
        $oldAvatarDisk = $user->avatar_disk ?: 'public';

        $newAvatar = null;

        /*
         * Upload the new avatar first.
         *
         * If the database update fails, we can remove the new file
         * without losing the existing avatar.
         */
        if ($avatar) {
            $newAvatar = $this->fileUploadService->upload(
                $avatar,
                "avatars/{$user->id}",
                config('uploads.avatar_disk', 'public'),
            );

            $attributes['avatar_path'] = $newAvatar['path'];
            $attributes['avatar_disk'] = $newAvatar['disk'];
        } elseif ($removeAvatar) {
            $attributes['avatar_path'] = null;
            $attributes['avatar_disk'] = null;
        }

        try {
            $updatedUser = $this->employees->update(
                $user,
                $attributes,
            );
        } catch (Throwable $exception) {
            if ($newAvatar) {
                try {
                    $this->fileUploadService->delete(
                        $newAvatar['path'],
                        $newAvatar['disk'],
                    );
                } catch (Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            throw $exception;
        }

        /*
         * Delete the old avatar only after the database update succeeds.
         */
        $avatarWasReplaced = $avatar !== null;
        $avatarWasRemoved = $removeAvatar && $oldAvatarPath !== null;

        if (
            $oldAvatarPath &&
            ($avatarWasReplaced || $avatarWasRemoved)
        ) {
            try {
                $this->fileUploadService->delete(
                    $oldAvatarPath,
                    $oldAvatarDisk,
                );
            } catch (Throwable $exception) {
                /*
                 * The database update has already succeeded.
                 * Report cleanup errors instead of treating the update
                 * as if it failed.
                 */
                report($exception);
            }
        }

        return $updatedUser;
    }

    /**
     * Activate or deactivate an employee.
     */
    public function setStatus(
        User $actor,
        User $target,
        UserStatus $status,
    ): User {
        if (
            $actor->is($target) &&
            $status === UserStatus::INACTIVE
        ) {
            throw ValidationException::withMessages([
                'status' => 'You cannot deactivate your own account.',
            ]);
        }

        return $this->employees->update($target, [
            'status' => $status->value,
        ]);
    }

    /**
     * Reset an employee's temporary password.
     */
    public function resetTempPassword(User $user): array
    {
        $tempPassword = $this->generateTempPassword();

        $user = $this->employees->update($user, [
            'password' => $tempPassword,
            'must_change_password' => true,
            'password_expires_at' => now()->addHours(
                self::TEMP_PASSWORD_HOURS
            ),
        ]);

        return [$user, $tempPassword];
    }

    /**
     * Generate a temporary password.
     */
    protected function generateTempPassword(): string
    {
        return Str::password(12, symbols: false);
    }
}