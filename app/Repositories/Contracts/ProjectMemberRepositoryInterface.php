<?php

namespace App\Repositories\Contracts;

use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Support\Collection;

interface ProjectMemberRepositoryInterface
{
    /** လက်ရှိ active individual member များ (user ပါ) */
    public function members(Project $project): Collection;

    /** Individual အဖြစ် ထည့်လို့ရတဲ့ active EMPLOYEE များ (ဒီ project မှာ individual row မရှိသေးသူ) */
    //public function candidates(Project $project, ?string $search = null, int $limit = 20): Collection;

    public function candidates(Project $project, ?string $search = null, int $limit = 20, ?array $teamIds = null): Collection;

    /** $userIds ထဲက $teamIds ထဲက team တစ်ခုခုရဲ့ active member ဖြစ်သူများ */
    public function userIdsInTeams(array $teamIds, array $userIds): array;
    
    public function eligibleEmployeeIds(array $userIds): array;

    /** ပေးထားတဲ့ id တွေထဲက ဒီ project မှာ active individual member ဖြစ်နေပြီးသားတွေ */
    public function activeMemberIds(Project $project, array $userIds): array;

    public function addMany(Project $project, array $userIds, int $actorId): void;

    public function findActive(Project $project, int $userId, bool $lock = false): ?ProjectMember;

    public function end(ProjectMember $member, int $actorId): void;

    /** Employee view အတွက် ကန့်သတ်ထားတဲ့ column (name, job title, avatar) သာ ယူမယ် */
    public function directory(array $userIds): Collection;
}