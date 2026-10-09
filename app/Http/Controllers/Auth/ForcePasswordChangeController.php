<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ForcePasswordChangeController extends Controller
{
    public function show(Request $request)
    {
        // Password ပြောင်းရန် မလိုတော့ပါက Dashboard သို့ ပြန်ညွှန်းမည်
        if (!$request->user()->must_change_password) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/ForceChangePassword');
    }

    public function update(Request $request)
    {
        //dd($request->toArray());
        
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);
        

        $user = $request->user();
        
        $user->update([
            //'password' => Hash::make($request->password),
            'password'=> $request->password,
            'must_change_password' => false, // Password ပြောင်းပြီးပါက Flag ကို ဖြုတ်မည်
            'password_expires_at' => null,
            
        ]);
        //dd($user->toArray());
        

        return redirect()->route('dashboard')->with('success', 'Password successfully updated.');
    }
}