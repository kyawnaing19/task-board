<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // User ရှိပြီး Password ပြောင်းရန် လိုအပ်နေပါက
        if ($user && $user->must_change_password) {
            // Password change/update route များ မဟုတ်ပါက Redirect လုပ်မည်
            if (!$request->routeIs('password.change', 'password.update', 'logout')) {
                return redirect()->route('password.change');
            }
        }

        return $next($request);
    }
}