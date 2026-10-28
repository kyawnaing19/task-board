<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use App\Repositories\Contracts\ProjectMemberRepositoryInterface;
use App\Repositories\Contracts\ProjectTeamRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectCreationService
{
    public function __construct(
        protected ProjectService $projects,
        protected ProjectAuthorization $authorization,
        protected TeamLeadership $leadership,
        protected ProjectTeamRepositoryInterface $teamLinks,
        protected ProjectMemberRepositoryInterface $memberLinks
    ) {}

    /**
     * Project ဆောက်ပြီး team link / individual member ကို transaction တစ်ခုတည်းမှာ ထည့်မယ်။
     * Leader ဆိုရင် ကိုယ်ဦးဆောင်တဲ့ team ကိုပဲ link၊ အဲဒီ team ရဲ့ member ကိုပဲ ထည့်လို့ရတယ်။
     */
    public function create(User $actor, array $data): Project
    {
        $this->authorization->assertCanCreate($actor);

        $teamIds = $this->ids($data['team_ids'] ?? []);
        $memberIds = $this->ids($data['member_ids'] ?? []);
        $isAdmin = $actor->isSuperAdmin();

        return DB::transaction(function () use ($actor, $data, $teamIds, $memberIds, $isAdmin) {
            // Team row တွေကို id စဉ် lock လုပ်မယ် (leader ပြောင်း / member ဖယ် / archive နဲ့ race မဖြစ်အောင်)
            $lock = $isAdmin
                ? $teamIds
                : array_values(array_unique(array_merge($teamIds, $this->leadership->ledTeamIds($actor))));
            sort($lock);

            if ($lock) {
                Team::query()->whereIn('id', $lock)->orderBy('id')->lockForUpdate()->get(['id']);
            }

            // Lock ယူပြီးမှ leadership ကို ပြန်ဖတ်မယ်
            $led = $isAdmin ? null : $this->leadership->ledTeamIds($actor);

            if ($led === []) {
                abort(403, 'Only a Super Admin or a team leader can create projects.');
            }

            if ($teamIds) {
                if (count($this->teamLinks->assignableTeamIds($teamIds)) !== count($teamIds)) {
                    throw ValidationException::withMessages([
                        'team_ids' => 'Only active (non-archived) teams can be linked to a project.',
                    ]);
                }

                if ($led !== null && array_diff($teamIds, $led)) {
                    throw ValidationException::withMessages(['team_ids' => 'You can only link teams you lead.']);
                }
            }

            if ($memberIds) {
                if (count($this->memberLinks->eligibleEmployeeIds($memberIds)) !== count($memberIds)) {
                    throw ValidationException::withMessages([
                        'member_ids' => 'Only active employees can be added to a project.',
                    ]);
                }

                if ($led !== null && count($this->memberLinks->userIdsInTeams($led, $memberIds)) !== count($memberIds)) {
                    throw ValidationException::withMessages([
                        'member_ids' => 'You can only add members of the teams you lead.',
                    ]);
                }
            }

            $project = $this->projects->create($actor, $data);

            if ($teamIds) {
                $this->teamLinks->addMany($project, $teamIds, $actor->id);
            }

            $individual = $memberIds;

            // Led team ကို မချိတ်ဘဲ member ရွေးရင် leader ကိုယ်တိုင် access မပျောက်အောင် individual member အဖြစ် ထည့်မယ်
            if ($led !== null && ! array_intersect($teamIds, $led)) {
                $individual[] = $actor->id;
            }

            $individual = array_values(array_unique($individual));

            if ($individual) {
                $this->memberLinks->addMany($project, $individual, $actor->id);
            }

            return $project;
        });
    }/**
     * Create form အတွက် ရွေးစရာ။ Leader ဆိုရင် ကိုယ်ဦးဆောင်တဲ့ team နဲ့ အဲဒီ team ရဲ့ member၊ Super Admin ဆိုရင် team စာရင်းပဲ။
     * Email မပါဘူး။
     */
    public function options(User $actor): array
    {
        $this->authorization->assertCanCreate($actor);

        if ($actor->isSuperAdmin()) {
            return [
                'teams' => Team::query()->active()->orderByRaw('LOWER(name)')->limit(200)->get(['id', 'name'])
                    ->map(fn (Team $t) => ['id' => $t->id, 'name' => $t->name, 'members' => []])->values()->all(),
            ];
        }

        $led = $this->leadership->ledTeamIds($actor);

        $teams = Team::query()->active()->whereIn('id', $led)->orderByRaw('LOWER(name)')->get(['id', 'name']);

        $members = TeamMembership::query()
            ->active()
            ->whereIn('team_id', $led)
            ->with('user:id,name,job_title,avatar_path,role,status')
            ->get()
            ->filter(fn ($m) => $m->user && $m->user->isActive() && ! $m->user->isSuperAdmin())
            ->groupBy('team_id');

        return [
            'teams' => $teams->map(fn (Team $t) => [
                'id'      => $t->id,
                'name'    => $t->name,
                'members' => ($members[$t->id] ?? collect())
                    ->map(fn ($m) => [
                        'id'         => $m->user->id,
                        'name'       => $m->user->name,
                        'job_title'  => $m->user->job_title,
                        'avatar_url' => $m->user->avatar_url,
                    ])
                    ->sortBy(fn ($u) => mb_strtolower($u['name']))
                    ->take(200)
                    ->values()
                    ->all(),
            ])->values()->all(),
        ];
    }

    /** @return int[] */
    protected function ids(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }
}