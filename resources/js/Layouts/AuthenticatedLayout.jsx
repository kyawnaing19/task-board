import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;

    // Sidebar state:
    // Desktop: expanded/collapsed
    // Mobile: open/closed
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const navigation = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: DashboardIcon,
            active: route().current('dashboard'),
        },

        // ...(user?.role === 'SUPER_ADMIN'
        //     ? [
        //           {
        //               name: 'Employees',
        //               href: route('employees.index'),
        //               icon: UsersIcon,
        //               active: route().current('employees.*'),
        //           },
        //       ]
        //     : []),
        ...(user?.role === 'SUPER_ADMIN'
    ? [
        { name: 'Employees', href: route('employees.index'), icon: UsersIcon, active: route().current('employees.*') },
        { name: 'Teams', href: route('teams.index'), icon: TeamIcon, active: route().current('teams.*') },
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

    return (
        <div className="flex min-h-screen bg-white text-slate-900">
            {/* =========================================================
                Mobile Backdrop
            ========================================================= */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
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
                    flex flex-col
                    border-r border-slate-200
                    bg-white
                    shadow-sm
                    transition-all duration-300 ease-in-out

                    /* Mobile */
                    w-64
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}

                    /* Desktop */
                    lg:translate-x-0
                    ${
                        sidebarOpen
                            ? 'lg:w-64'
                            : 'lg:w-[72px]'
                    }
                `}
            >
                {/* =====================================================
                    Sidebar Header
                ===================================================== */}
                <div
                    className={`
                        flex h-16 shrink-0 items-center
                        border-b border-slate-200
                        ${
                            sidebarOpen
                                ? 'justify-between px-4'
                                : 'justify-center px-2'
                        }
                    `}
                >
                    {/* Brand / Navigation label */}
                    <div
                        className={`
                            min-w-0 overflow-hidden
                            transition-all duration-200
                            ${
                                sidebarOpen
                                    ? 'w-auto opacity-100'
                                    : 'hidden opacity-0'
                            }
                        `}
                    >
                        <span className="text-sm font-semibold tracking-wide text-slate-700">
                            Navigation
                        </span>
                    </div>

                    {/* on/off sidebar */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen((open) => !open)}
                        className="
                            shrink-0 rounded-lg p-2
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            hover:text-slate-900
                            focus:outline-none
                            focus:ring-2
                            focus:ring-indigo-500/30
                        "
                        aria-label={
                            sidebarOpen
                                ? 'Collapse navigation'
                                : 'Expand navigation'
                        }
                        aria-expanded={sidebarOpen}
                    >
                        {sidebarOpen ? (
                            <MenuOpenIcon className="h-5 w-5" />
                        ) : (
                            <MenuIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* =====================================================
                    Navigation
                ===================================================== */}
                <nav className="flex-1 overflow-y-auto px-3 py-5">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        group flex items-center
                                        rounded-xl
                                        py-2.5
                                        text-sm font-medium
                                        transition-all duration-150

                                        ${
                                            sidebarOpen
                                                ? 'gap-3 px-3.5'
                                                : 'justify-center px-2'
                                        }

                                        ${
                                            item.active
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }
                                    `}
                                    title={!sidebarOpen ? item.name : undefined}
                                >
                                    <Icon
                                        className={`
                                            h-5 w-5 shrink-0
                                            transition-colors

                                            ${
                                                item.active
                                                    ? 'text-white'
                                                    : 'text-slate-500 group-hover:text-slate-700'
                                            }
                                        `}
                                    />

                                    <span
                                        className={`
                                            whitespace-nowrap
                                            overflow-hidden
                                            transition-all duration-200
                                            ${
                                                sidebarOpen
                                                    ? 'w-auto opacity-100'
                                                    : 'hidden w-0 opacity-0'
                                            }
                                        `}
                                    >
                                        {item.name}
                                    </span>
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

                    /* Desktop sidebar width */
                    ${
                        sidebarOpen
                            ? 'lg:ml-64'
                            : 'lg:ml-[72px]'
                    }
                `}
            >
                {/* =====================================================
                    Top Header
                ===================================================== */}
                <header
                    className="
                        sticky top-0 z-30
                        flex h-16 shrink-0
                        items-center justify-between
                        border-b border-slate-200
                        bg-white/95
                        px-4
                        backdrop-blur-md
                        sm:px-6
                        lg:px-8
                    "
                >
                    {/* Left */}
                    <div className="flex min-w-0 items-center gap-3">
                        {/* =================================================
                            Mobile Sidebar Toggle

                            Desktop မှာ hamburger က sidebar ပေါ်မှာရှိတယ်။
                            Mobile မှာ sidebar ပိတ်သွားတဲ့အခါ
                            ပြန်ဖွင့်နိုင်ဖို့ ဒီ button ကိုပဲပြမယ်။
                        ================================================= */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className={`
                                shrink-0 rounded-lg p-2
                                text-slate-500
                                transition
                                hover:bg-slate-100
                                hover:text-slate-900
                                focus:outline-none
                                focus:ring-2
                                focus:ring-indigo-500/30
                                lg:hidden
                                ${
                                    sidebarOpen
                                        ? 'hidden'
                                        : 'block'
                                }
                            `}
                            aria-label="Open navigation"
                        >
                            <MenuIcon className="h-5 w-5" />
                        </button>

                        {header && (
                            <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
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
                                text-slate-600
                                transition
                                hover:bg-slate-100
                                hover:text-slate-900
                                focus:outline-none
                                focus:ring-2
                                focus:ring-indigo-500/30
                            "
                            aria-haspopup="menu"
                            aria-expanded={userDropdownOpen}
                        >
                            {/* Avatar */}
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100">
                                {user?.name?.charAt(0)?.toUpperCase()}
                            </div>

                            <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                                {user?.name}
                            </span>

                            <ChevronDownIcon
                                className={`
                                    h-4 w-4 text-slate-400
                                    transition-transform duration-200

                                    ${
                                        userDropdownOpen
                                            ? 'rotate-180'
                                            : ''
                                    }
                                `}
                            />
                        </button>

                        {/* =================================================
                            User Dropdown
                        ================================================= */}
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
                                        border border-slate-200
                                        bg-white
                                        shadow-xl shadow-slate-200/60
                                    "
                                >
                                    <div className="border-b border-slate-200 px-4 py-3">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Signed in as
                                        </p>

                                        <p className="mt-1 truncate text-sm font-medium text-slate-700">
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
                                            text-rose-500
                                            transition
                                            hover:bg-rose-50
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
                <main className="min-w-0 flex-1 bg-slate-50/50 p-4 sm:p-6 lg:p-8">
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

function TeamIcon(props) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
