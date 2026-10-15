<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\MyProjectController;
use App\Http\Controllers\MyTeamController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectTeamController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskGroupController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TeamMemberController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TaskBoardController;


// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware(['auth', 'active'])->group(function () {

    // Logout Route
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // 1. Force Password Change Routes (must_change_password middleware မလိုပါ)
    Route::get('/force-change-password', [ForcePasswordChangeController::class, 'show'])
        ->name('password.change');
    Route::post('/force-change-password', [ForcePasswordChangeController::class, 'update'])
        ->name('password.update');

    Route::middleware(['must_change_password'])->group(function () {

        Route::get('/', function () {
            return redirect()->route('dashboard');
        });

        Route::get('/dashboard', function () {
            return Inertia::render('Dashboard');
        })->name('dashboard');

        Route::middleware('super_admin')
            ->prefix('employees')
            ->name('employees.')
            ->group(function () {
                Route::get('/', [EmployeeController::class, 'index'])->name('index');
                Route::post('/', [EmployeeController::class, 'store'])->name('store');
                Route::get('/{user}', [EmployeeController::class, 'showDetail'])->name('Deatil');
                Route::patch('/{user}/status', [EmployeeController::class, 'updateStatus'])->name('status');
                Route::post('/{user}/reset-password', [EmployeeController::class, 'resetPassword'])->name('reset-password');
                Route::put('/{user}', [EmployeeController::class, 'update'])->name('update');
            });

        

        Route::middleware('super_admin')
            ->prefix('teams')
            ->name('teams.')
            ->group(function () {
                Route::get('/', [TeamController::class, 'index'])->name('index');
                Route::get('/{team}', [TeamController::class, 'show'])->name('show');
                Route::post('/', [TeamController::class, 'store'])->name('store');
                Route::put('/{team}', [TeamController::class, 'update'])->name('update');
                Route::post('/{team}/archive', [TeamController::class, 'archive'])->name('archive');
                Route::get('/{team}/archive-preview', [TeamController::class, 'archivePreview'])->name('archive-preview');
                Route::post('/{team}/restore', [TeamController::class, 'restore'])->name('restore');
            });

        

        Route::middleware('super_admin')
        ->prefix('/{team}/members')->name('teams.members.')->group(function () {
            Route::get('/candidates', [TeamMemberController::class, 'candidates'])->name('candidates');
            Route::post('/preview', [TeamMemberController::class, 'previewAdd'])->name('preview-add');
            Route::post('/', [TeamMemberController::class, 'store'])->name('store');
            Route::get('/{user}/preview-removal', [TeamMemberController::class, 'previewRemove'])->name('preview-remove');
            Route::delete('/{user}', [TeamMemberController::class, 'destroy'])->name('destroy');
        }); 
        

        Route::middleware('super_admin')
            ->prefix('projects')
            ->name('projects.')
            ->group(function () {
                Route::get('/', [ProjectController::class, 'index'])->name('index');
                Route::post('/', [ProjectController::class, 'store'])->name('store');
                Route::get('/{project}', [ProjectController::class, 'show'])->name('show');
                Route::put('/{project}', [ProjectController::class, 'update'])->name('update');
                Route::patch('/{project}/status', [ProjectController::class, 'changeStatus'])->name('status');
                Route::post('/{project}/archive', [ProjectController::class, 'archive'])->name('archive');
                Route::post('/{project}/restore', [ProjectController::class, 'restore'])->name('restore');


                Route::prefix('/{project}/teams')->name('teams.')->group(function () {
                    Route::get('/candidates', [ProjectTeamController::class, 'candidates'])->name('candidates');
                    Route::post('/preview', [ProjectTeamController::class, 'previewAdd'])->name('preview-add');
                    Route::post('/', [ProjectTeamController::class, 'store'])->name('store');
                    Route::get('/{team}/preview-removal', [ProjectTeamController::class, 'previewRemove'])->name('preview-remove');
                    Route::delete('/{team}', [ProjectTeamController::class, 'destroy'])->name('destroy');
                    Route::post('/resolve-archived', [ProjectTeamController::class, 'resolveArchived'])->name('resolve-archived');
                });


                Route::prefix('/{project}/members')->name('members.')->group(function () {
                    Route::get('/candidates', [ProjectMemberController::class, 'candidates'])->name('candidates');
                    Route::post('/preview', [ProjectMemberController::class, 'previewAdd'])->name('preview-add');
                    Route::post('/', [ProjectMemberController::class, 'store'])->name('store');
                    Route::get('/{user}/preview-removal', [ProjectMemberController::class, 'previewRemove'])->name('preview-remove');
                    Route::delete('/{user}', [ProjectMemberController::class, 'destroy'])->name('destroy');
                });


            });


        Route::middleware('super_admin')
            ->prefix('task-groups')
            ->name('task-groups.')
            ->group(function () {
                Route::get('/', [TaskGroupController::class, 'index'])->name('index');
                Route::post('/', [TaskGroupController::class, 'store'])->name('store');
                Route::post('/reorder', [TaskGroupController::class, 'reorder'])->name('reorder');
                Route::put('/{taskGroup}', [TaskGroupController::class, 'update'])->name('update');
                Route::get('/{taskGroup}/archive-preview', [TaskGroupController::class, 'archivePreview'])->name('archive-preview');
                Route::post('/{taskGroup}/archive', [TaskGroupController::class, 'archive'])->name('archive');
                Route::post('/{taskGroup}/restore', [TaskGroupController::class, 'restore'])->name('restore');
                Route::get('/change/{flag}/preview', [TaskGroupController::class, 'previewFlag'])
                        ->whereIn('flag', ['initial', 'completed'])->name('flag.preview');
                Route::post('/change/{flag}', [TaskGroupController::class, 'changeFlag'])
                        ->whereIn('flag', ['initial', 'completed'])->name('flag.change');
                
            });
        

        Route::middleware('super_admin')
            ->prefix('tags')
            ->name('tags.')
            ->group(function () {
                Route::get('/', [TagController::class, 'index'])->name('index');
                Route::post('/', [TagController::class, 'store'])->name('store');
                Route::put('/{tag}', [TagController::class, 'update'])->name('update');
                Route::post('/{tag}/archive', [TagController::class, 'archive'])->name('archive');
                Route::post('/{tag}/restore', [TagController::class, 'restore'])->name('restore');
            });
        

        Route::prefix('my-teams')->name('my-teams.')->group(function () {
            Route::get('/', [MyTeamController::class, 'index'])->name('index');
            Route::get('/{team}', [MyTeamController::class, 'show'])->whereNumber('team')->name('show');
        });


        Route::prefix('my-projects')->name('my-projects.')->group(function () {
            Route::get('/', [MyProjectController::class, 'index'])->name('index');
            Route::get('/{project}', [MyProjectController::class, 'show'])->whereNumber('project')->name('show');
        });


        Route::post('/projects/{project}/tasks', [TaskController::class, 'store'])
            ->whereNumber('project')
            ->name('projects.tasks.store');
        Route::patch('/tasks/{task}', [TaskController::class, 'update'])
            ->whereNumber('task')
            ->name('tasks.update');
        Route::patch('/tasks/{task}/move', [TaskController::class, 'move'])
            ->whereNumber('task')
            ->name('tasks.move');
        Route::post('/tasks/{task}/archive', [TaskController::class, 'archive'])
            ->whereNumber('task')->name('tasks.archive');
        Route::post('/tasks/{task}/restore', [TaskController::class, 'restore'])
            ->whereNumber('task')->name('tasks.restore');
        Route::get('/projects/{project}/tasks/archived', [TaskController::class, 'archived'])
            ->whereNumber('project')->name('projects.tasks.archived');
        Route::get('/projects/{project}/board', [TaskBoardController::class, 'board'])
            ->whereNumber('project')->name('projects.board');
        Route::get('/projects/{project}/board/options', [TaskBoardController::class, 'options'])
            ->whereNumber('project')->name('projects.board.options');
        Route::get('/projects/{project}/board/groups/{taskGroup}', [TaskBoardController::class, 'group'])
            ->whereNumber(['project', 'taskGroup'])->name('projects.board.group');
        Route::get('/tasks/{task}', [TaskBoardController::class, 'show'])
            ->whereNumber('task')->name('tasks.show');
        Route::get('/tasks/{task}/history', [TaskBoardController::class, 'history'])
            ->whereNumber('task')->name('tasks.history');


        // Domain Specific Routes (Projects, Task Groups, Tasks...)
        // Route::resource('projects', ProjectController::class);
    });
});
