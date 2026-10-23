<?php

namespace App\Http\Controllers;

use App\Enums\GroupColor;
use App\Http\Requests\Tag\RestoreTagRequest;
use App\Http\Requests\Tag\StoreTagRequest;
use App\Http\Requests\Tag\UpdateTagRequest;
use App\Models\Tag;
use App\Repositories\Contracts\TagRepositoryInterface;
use App\Services\TagService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function __construct(
        protected TagService $service,
        protected TagRepositoryInterface $tags
    ) {}

    public function index(Request $request): Response
    {
        $archived = $request->query('status') === 'archived';
        $search = $request->query('search', '');

        $active = $this->tags->list(false, $search);
        $rows = $archived ? $this->tags->list(true, $search) : $active;
        $usage = $this->tags->usageCounts($rows->pluck('id')->all());

        return Inertia::render('Tags/Index', [
            'tags' => $rows->map(fn (Tag $t) => [
                'id'          => $t->id,
                'name'        => $t->name,
                'color'       => $t->color,
                'archived_at' => $t->archived_at,
                'tasks_count' => $usage[$t->id] ?? 0,
            ])->values(),
            // Restore မှာ နာမည်တူနေလားကို client က ကြိုစစ်ဖို့
            'active_names' => $active->pluck('name')->values(),
            'colors'       => array_column(GroupColor::cases(), 'value'),
            'filters'      => ['status' => $archived ? 'archived' : 'active', 'search' => $search],
        ]);
    }

    public function store(StoreTagRequest $request): RedirectResponse
    {
        $tag = $this->service->create($request->user(), $request->validated());

        return back()->with('success', "Tag \"{$tag->name}\" created.");
    }

    public function update(UpdateTagRequest $request, Tag $tag): RedirectResponse
    {
        $this->service->update($tag, $request->validated());

        return back()->with('success', 'Tag updated.');
    }

    public function archive(Request $request, Tag $tag): RedirectResponse
    {
        $this->service->archive($request->user(), $tag);

        return back()->with('success', "Tag \"{$tag->name}\" archived.");
    }

    public function restore(RestoreTagRequest $request, Tag $tag): RedirectResponse
    {
        $restored = $this->service->restore($tag, $request->validated('name'));

        return back()->with('success', "Tag \"{$restored->name}\" restored.");
    }
}