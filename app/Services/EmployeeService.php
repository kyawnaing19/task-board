<?php

namespace App\Services;


use App\Enums\UserStatus;
use App\Models\User;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;


class EmployeeService
{
    public const TEMP_PASSWORD_HOURS = 24;

    public function __construct(
        protected EmployeeRepositoryInterface $employees
    ) {}

    /**
     * Employee
     *
     * @return array{0: User, 1: string} [user, plain temp password]
     */
    public function create(array $data, ?UploadedFile $avatar = null): array
    {
        $tempPassword = $this->generateTempPassword();

        $user = $this->employees->create([
            'name'                 => $data['name'],
            'email'                => $data['email'],
            'job_title'            => $data['job_title'] ?? null,
            'role'                 => $data['role'],
            'status'               => UserStatus::ACTIVE->value,
            'password'             => $tempPassword, // User model ရဲ့ 'hashed' cast က hash လုပ်ပေးမယ်
            'must_change_password' => true,
            'password_expires_at'  => now()->addHours(self::TEMP_PASSWORD_HOURS),
            'email_verified_at'    => now(),
            'avatar_path'          => $avatar?->store('avatars', 'public'),
        ]);

        return [$user, $tempPassword];
    }

    public function showDetail(User $user)
    {
        return $this->employees->showDetail($user);
    }
 
    public function update(User $user, array $data, ?UploadedFile $avatar = null, bool $removeAvatar = false): User
    {
        $attributes = Arr::only($data, ['name', 'email','job_title']); // whitelist

        $oldAvatar = $user->avatar_path;

        if ($avatar) {
            $attributes['avatar_path'] = $avatar->store('avatars', 'public');
        } elseif ($removeAvatar) {
            $attributes['avatar_path'] = null;
        }

        $user = $this->employees->update($user, $attributes);

        // DB update အောင်မြင်ပြီးမှ ဖိုင်အဟောင်းကို ဖျက်မယ်
        if ($oldAvatar && array_key_exists('avatar_path', $attributes)) {
            Storage::disk('public')->delete($oldAvatar);
        }

        return $user;
    }

    /**
     * Activate / Deactivate
     */
    public function setStatus(User $actor, User $target, UserStatus $status): User
    {
        if ($actor->is($target) && $status === UserStatus::INACTIVE) {
            throw ValidationException::withMessages([
                'status' => 'You cannot deactivate your own account.',
            ]);
        }

        return $this->employees->update($target, [
            'status' => $status->value,
        ]);
    }

   
    public function resetTempPassword(User $user): array
    {
        $tempPassword = $this->generateTempPassword();

        $user = $this->employees->update($user, [
            'password'             => $tempPassword,
            'must_change_password' => true,
            'password_expires_at'  => now()->addHours(self::TEMP_PASSWORD_HOURS),
        ]);

        return [$user, $tempPassword];
    }

    protected function generateTempPassword(): string
    {
        return Str::password(12, symbols: false);
    }
}