<?php

namespace App\Repositories\Contracts;

use App\Models\TaskGroup;
use Illuminate\Support\Collection;

interface TaskGroupRepositoryInterface
{
    public function list(bool $archived = false): Collection;

    /** Group row အားလုံးကို lock လုပ်ပြီး ယူမယ် (group management ကို serialize လုပ်ဖို့) */
    public function lockAll(): Collection;

    public function activeNameExists(string $name, ?int $ignoreId = null): bool;

    public function nextSortOrder(): int;

    public function create(array $data): TaskGroup;

    public function update(TaskGroup $group, array $data): TaskGroup;

    /** @param array<int, int> $orders group id => sort_order */
    public function setSortOrders(array $orders): void;

    /** Flag column (is_initial / is_completed) ကို ကိုင်ထားတဲ့ group */
    public function holderOf(string $column): ?TaskGroup;

    /** Flag ကို from ကနေ to ဆီ လွှဲမယ်။ unique index မထိအောင် from ကို အရင် NULL လုပ်မယ် */
    public function moveFlag(string $column, ?TaskGroup $from, TaskGroup $to): void;
}