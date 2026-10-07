<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        // Session ရှိပြီးသား User ၏ status ကို စစ်ဆေးခြင်း
        if ($request->user() && ! $request->user()->isActive()) {
            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'သင်၏ အကောင့်မှာ ပိတ်သိမ်း ခံထားရသဖြင့် Logout ပြုလုပ်လိုက်ပါသည်။',
            ]);
        }

        return $next($request);
    }
}