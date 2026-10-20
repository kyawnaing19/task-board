<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use RuntimeException;

class FileUploadService
{
    /**
     * Upload a file to the specified disk and directory.
     *
     * Example:
     * upload($file, 'avatars/15', 'public')
     * upload($file, 'task-attachments/25', 'private')
     *
     * @return array{disk: string, path: string}
     */
    public function upload(
        UploadedFile $file,
        string $directory,
        ?string $disk = null,
    ): array {
        if (! $file->isValid()) {
            throw ValidationException::withMessages([
                'file' => 'The uploaded file is invalid.',
            ]);
        }

        $diskName = $disk ?? config('filesystems.default');

        $directory = trim($directory, '/');

        if ($directory === '') {
            throw new InvalidArgumentException(
                'The upload directory cannot be empty.'
            );
        }

        if (! config("filesystems.disks.{$diskName}")) {
            throw new InvalidArgumentException(
                "The filesystem disk [{$diskName}] is not configured."
            );
        }

        $path = $file->store($directory, $diskName);

        if (! $path) {
            throw new RuntimeException(
                'The file could not be stored.'
            );
        }

        return [
            'disk' => $diskName,
            'path' => $path,
        ];
    }

    /**
     * Delete a file from the disk where it was stored.
     *
     * Pass the disk saved in the database.
     */
    public function delete(
        ?string $path,
        ?string $disk = null,
    ): bool {
        if (! $path) {
            return false;
        }

        $diskName = $disk ?? config('filesystems.default');

        if (! config("filesystems.disks.{$diskName}")) {
            throw new InvalidArgumentException(
                "The filesystem disk [{$diskName}] is not configured."
            );
        }

        $storage = Storage::disk($diskName);

        if (! $storage->exists($path)) {
            return true;
        }

        return $storage->delete($path);
    }

    /**
     * Generate a URL for a publicly accessible file.
     */
    public function url(
        string $path,
        ?string $disk = null,
    ): string {
        $diskName = $disk ?? config('filesystems.default');

        if (! config("filesystems.disks.{$diskName}")) {
            throw new InvalidArgumentException(
                "The filesystem disk [{$diskName}] is not configured."
            );
        }

        return Storage::disk($diskName)->url($path);
    }

    /**
     * Generate a temporary URL for a private file.
     *
     * S3 supports temporary URLs.
     * Local private storage should use an authorized download controller.
     */
    public function temporaryUrl(
        string $path,
        \DateTimeInterface $expiration,
        ?string $disk = null,
    ): string {
        $diskName = $disk ?? config('filesystems.default');

        if (! config("filesystems.disks.{$diskName}")) {
            throw new InvalidArgumentException(
                "The filesystem disk [{$diskName}] is not configured."
            );
        }

        $storage = Storage::disk($diskName);

        if (! $storage->providesTemporaryUrls()) {
            throw new RuntimeException(
                "The filesystem disk [{$diskName}] does not support temporary URLs. "
                .'Use an authorized download controller for local private files.'
            );
        }

        return $storage->temporaryUrl(
            $path,
            $expiration,
        );
    }
}
