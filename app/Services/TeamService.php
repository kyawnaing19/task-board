<?php

namespace App\Services;

use App\Models\Team;
use App\Models\User;
use App\Repositories\Contracts\TeamRepositoryInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\ValidationException;

class TeamService
{
    public function __construct(
        protected TeamRepositoryInterface $teams
    ) {}

    public function create(User $actor, array $data): Team
    {
        try {
            return $this->teams->create([
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'created_by'  => $actor->id,
            ]);
        } catch (UniqueConstraintViolationException) {
            throw $this->duplicateNameException();
        }
    }

    public function update(Team $team, array $data): Team
    {
        if ($team->isArchived()) {
            throw ValidationException::withMessages([
                'team' => 'Archived teams cannot be edited. Restore the team first.',
            ]);
        }

        try {
            return $this->teams->update($team, [
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
            ]);
        } catch (UniqueConstraintViolationException) {
            throw $this->duplicateNameException();
        }
    }

    public function archive(User $actor, Team $team): Team
    {
        if ($team->isArchived()) {
            throw ValidationException::withMessages([
                'team' => 'This team is already archived.',
            ]);
        }

        if ($blockers = $this->archiveBlockers($team)) {
            throw ValidationException::withMessages([
                'team' => $blockers[0],
            ]);
        }

        return $this->teams->update($team, [
            'archived_at' => now(),
            'archived_by' => $actor->id,
        ]);
    }

    public function restore(Team $team): Team
    {
        if (! $team->isArchived()) {
            throw ValidationException::withMessages([
                'team' => 'This team is not archived.',
            ]);
        }

        return $this->teams->update($team, [
            'archived_at' => null,
            'archived_by' => null,
        ]);
    }

    /**
     * Archive လုပ်ခွင့်ကို တားမယ့် အကြောင်းရင်းများ။
     *
     * TODO (Projects module): Active ဖြစ်ပြီး archive မလုပ်ရသေးတဲ့ Project တစ်ခုခုနဲ့
     * ချိတ်ထားရင် ဥပမာ - "Remove this team from its active projects or mark them Completed first."
     * ကို ပြန်ပေးမယ်။
     *
     * @return string[]
     */
    public function archiveBlockers(Team $team): array
    {
        return [];
    }

    /**
     * Archive confirmation မှာ ပြမယ့် impact။
     *
     * TODO (Members + Projects modules): ဒီ Team ကတစ်ခုတည်းသော access source ဖြစ်နေလို့
     * Completed/Archived Project တွေအပေါ် access ဆုံးရှုံးမယ့် Employee နဲ့ Project အရေအတွက်ကို တွက်မယ်။
     *
     * @return array{employees: int, projects: int}
     */
    public function archiveImpact(Team $team): array
    {
        return ['employees' => 0, 'projects' => 0];
    }

    protected function duplicateNameException(): ValidationException
    {
        return ValidationException::withMessages([
            'name' => 'A team with this name already exists (it may be archived).',
        ]);
    }
}