<?php
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

// Authenticated + Active User Protected Routes
// Route::middleware(['auth', 'active'])->group(function () {
//     Route::get('/dashboard', function () {
//         return Inertia::render('Dashboard');
//     })->name('dashboard');

//     Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
// });


Route::middleware(['auth', 'active'])->group(function () {
    
    // Logout Route
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // 1. Force Password Change Routes (must_change_password middleware မလိုပါ)
    Route::get('/force-change-password', [ForcePasswordChangeController::class, 'show'])
        ->name('password.change');
    Route::post('/force-change-password', [ForcePasswordChangeController::class, 'update'])
        ->name('password.update');

    // 2. Protected Application Routes (must_change_password စစ်ဆေးပြီးမှ ဝင်ခွင့်ပြုမည်)
    Route::middleware(['must_change_password'])->group(function () {
        
        Route::get('/', function () {
            return redirect()->route('dashboard');
        });

        Route::get('/dashboard', function () {
            return Inertia::render('Dashboard');
        })->name('dashboard');

        // Domain Specific Routes (Projects, Task Groups, Tasks...)
        // Route::resource('projects', ProjectController::class);
    });
});