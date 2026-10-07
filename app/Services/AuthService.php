<?php
namespace App\Services;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    /**
     * Authenticate user credential & state.
     */
   public function authenticate(
    string $email,
    string $password,
    bool $remember,
    Request $request
    ): User {
    $user = $this->userRepository->findByEmail($email);

    if (! $user || ! Hash::check($password, $user->password)) {
        //dd("reach");
        throw ValidationException::withMessages([
            'email' => trans('auth.failed'),
        
        ]);
    }

    if (! $user->isActive()) {
        throw ValidationException::withMessages([
            'email' => 'Your account is inactive.',
        ]);
    }

    Auth::login($user, $remember);

    $request->session()->regenerate();

    return $user;
}

    /**
     * Logout and invalidate session.
     */
    public function logout(Request $request): void
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}