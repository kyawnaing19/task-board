import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    // Desktop: sidebar starts open
    // Mobile: sidebar starts closed
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: DashboardIcon,
            active: route().current('dashboard'),
        },
        ...(user?.role === 'SUPER_ADMIN'
            ? [
                  {
                      name: 'Employees',
                      href: route('employees.index'),
                      icon: UsersIcon,
                      active: route().current('employees.*'),
                  },
              ]
            : []),
        {
            name: 'Projects',
            href: '#',
            icon: ProjectIcon,
            active: route().current('projects.*'),
        },
        {
            name: 'Task Groups',
            href: '#',
            icon: TaskGroupIcon,
            active: route().current('task-groups.*'),
        },
        {
            name: 'Tasks',
            href: '#',
            icon: TaskIcon,
            active: route().current('tasks.*'),
        },
    ];

    const closeSidebarOnMobile = () => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            {/* =========================================================
                Mobile Backdrop
            ========================================================= */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* =========================================================
                Sidebar
            ========================================================= */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50
                    flex w-64 flex-col
                    border-r border-slate-800
                    bg-slate-900
                    shadow-2xl shadow-black/20
                    transition-transform duration-300 ease-in-out

                    ${
                        sidebarOpen
                            ? 'translate-x-0'
                            : '-translate-x-full'
                    }

                    lg:translate-x-0
                    ${
                        sidebarOpen
                            ? 'lg:w-64'
                            : 'lg:w-0 lg:-translate-x-full lg:overflow-hidden lg:border-r-0'
                    }
                `}
            >
                {/* Sidebar Header */}
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
                    <span className="text-sm font-semibold tracking-wide text-slate-400">
                        Navigation
                    </span>

                    {/* Close button - mobile only */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white lg:hidden"
                        aria-label="Close navigation"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-5">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={closeSidebarOnMobile}
                                    className={`
                                        group flex items-center gap-3
                                        rounded-xl px-3.5 py-2.5
                                        text-sm font-medium
                                        transition-all duration-150

                                        ${
                                            item.active
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                                        }
                                    `}
                                >
                                    <Icon
                                        className={`
                                            h-5 w-5 shrink-0 transition-colors

                                            ${
                                                item.active
                                                    ? 'text-white'
                                                    : 'text-slate-500 group-hover:text-slate-300'
                                            }
                                        `}
                                    />

                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* =========================================================
                Main Content
            ========================================================= */}
            <div
                className={`
                    flex min-w-0 flex-1 flex-col
                    transition-[margin] duration-300 ease-in-out

                    ${
                        sidebarOpen
                            ? 'lg:ml-64'
                            : 'lg:ml-0'
                    }
                `}
            >
                {/* =====================================================
                    Top Header
                ===================================================== */}
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
                    {/* Left */}
                    <div className="flex min-w-0 items-center gap-3">
                        {/* Sidebar Toggle */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((open) => !open)}
                            className="
                                shrink-0 rounded-lg p-2
                                text-slate-400
                                transition
                                hover:bg-slate-800
                                hover:text-white
                                focus:outline-none
                                focus:ring-2
                                focus:ring-indigo-500/40
                            "
                            aria-label={
                                sidebarOpen
                                    ? 'Hide navigation'
                                    : 'Show navigation'
                            }
                            aria-expanded={sidebarOpen}
                        >
                            {sidebarOpen ? (
                                <MenuOpenIcon className="h-5 w-5" />
                            ) : (
                                <MenuIcon className="h-5 w-5" />
                            )}
                        </button>

                        {header && (
                            <h1 className="truncate text-base font-semibold text-slate-100 sm:text-lg">
                                {header}
                            </h1>
                        )}
                    </div>

                    {/* =================================================
                        User Menu
                    ================================================= */}
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                setUserDropdownOpen((open) => !open)
                            }
                            className="
                                flex items-center gap-2
                                rounded-xl px-2 py-1.5
                                text-slate-300
                                transition
                                hover:bg-slate-800
                                hover:text-white
                                focus:outline-none
                                focus:ring-2
                                focus:ring-indigo-500/30
                            "
                            aria-haspopup="menu"
                            aria-expanded={userDropdownOpen}
                        >
                            {/* Avatar */}
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-300">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>

                            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                                {user?.name}
                            </span>

                            <ChevronDownIcon
                                className={`
                                    h-4 w-4 text-slate-500
                                    transition-transform duration-200
                                    ${
                                        userDropdownOpen
                                            ? 'rotate-180'
                                            : ''
                                    }
                                `}
                            />
                        </button>

                        {/* User Dropdown */}
                        {userDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() =>
                                        setUserDropdownOpen(false)
                                    }
                                />

                                <div
                                    role="menu"
                                    className="
                                        absolute right-0 z-20 mt-2
                                        w-60 overflow-hidden
                                        rounded-xl
                                        border border-slate-800
                                        bg-slate-900
                                        shadow-2xl shadow-black/30
                                    "
                                >
                                    <div className="border-b border-slate-800 px-4 py-3">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                            Signed in as
                                        </p>

                                        <p className="mt-1 truncate text-sm font-medium text-slate-200">
                                            {user?.email}
                                        </p>
                                    </div>

                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        type="button"
                                        className="
                                            flex w-full items-center gap-2
                                            px-4 py-2.5
                                            text-left text-sm
                                            text-rose-400
                                            transition
                                            hover:bg-rose-500/10
                                        "
                                    >
                                        <LogoutIcon className="h-4 w-4" />
                                        Sign Out
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* =====================================================
                    Page Content
                ===================================================== */}
                <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

/* =============================================================
   Icons
============================================================= */

function DashboardIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
        </svg>
    );
}

function ProjectIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
        </svg>
    );
}

function TaskGroupIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
        </svg>
    );
}

function TaskIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
        </svg>
    );
}

function MenuIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
            />
        </svg>
    );
}

function MenuOpenIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h10M4 18h16"
            />
        </svg>
    );
}

function CloseIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 6l12 12M18 6L6 18"
            />
        </svg>
    );
}

function ChevronDownIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
            />
        </svg>
    );
}

function LogoutIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
        </svg>
    );
}

function UsersIcon(props) {
    return (
        <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
        </svg>
    );
}

