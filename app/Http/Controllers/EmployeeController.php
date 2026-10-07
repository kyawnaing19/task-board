<?php

namespace App\Http\Controllers;

use App\Enums\Enums\UserStatus as EnumsUserStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\User;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Services\EmployeeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(
        protected EmployeeService $service,
        protected EmployeeRepositoryInterface $employees
    ) {}

    public function index(): Response
    {
        return Inertia::render('Employees/Index', [
            'employees' => $this->employees->paginate(),
            'roles'     => array_column(UserRole::cases(), 'value'),
        ]);
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        [$user, $tempPassword] = $this->service->create(
            $request->validated(),
            $request->file('avatar')
        );

        // flash ဖြစ်လို့ တစ်ကြိမ်ပဲ ပြမယ်၊ refresh လုပ်ရင် ပျောက်မယ်
        return redirect()->route('employees.index')->with('credentials', [
            'email'         => $user->email,
            'temp_password' => $tempPassword,
            'expires_at'    => $user->password_expires_at,
        ]);
    }

    public function update(UpdateEmployeeRequest $request, User $user): RedirectResponse
    {
        $this->service->update(
            $user,
            $request->validated(),
            $request->file('avatar'),
            $request->boolean('remove_avatar')
        );

        return back()->with('success', 'Employee updated.');
    }

    public function updateStatus(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(EnumsUserStatus::class)],
        ]);

        $this->service->setStatus(
            $request->user(),
            $user,
            EnumsUserStatus::from($data['status'])
        );

        return back()->with('success', 'Employee status updated.');
    }

    public function resetPassword(User $user): RedirectResponse
    {
        [$user, $tempPassword] = $this->service->resetTempPassword($user);

        return back()->with('credentials', [
            'email'         => $user->email,
            'temp_password' => $tempPassword,
            'expires_at'    => $user->password_expires_at,
        ]);
    }
}