import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateEmployeeModal from './Partials/CreateEmployeeModal';
import EditEmployeeModal from './Partials/EditEmployeeModal';
import RowActionsMenu from '../../Components/RowActionsMenu';
import EmployeeDetailModal from './Partials/EmployeeDetailModal';

export default function Index({ employees, roles, filters }) {
    const { auth, flash } = usePage().props;
    const credentials = flash?.credentials;

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [detail, setDetail] = useState(null);
    const [dismissed, setDismissed] = useState(null);
    const [copied, setCopied] = useState(false);

    // Server-side search
    const [search, setSearch] = useState(filters?.search ?? '');

    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters?.search ?? '';

            if (search === currentSearch) {
                return;
            }

            router.get(
                route('employees.index'),
                {
                    search: search || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const toggleStatus = (user) => {
        const next =
            user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        const label =
            next === 'INACTIVE' ? 'deactivate' : 'activate';

        if (
            !confirm(
                `Are you sure you want to ${label} ${user.name}?`,
            )
        ) {
            return;
        }

        router.patch(
            route('employees.status', user.id),
            { status: next },
            { preserveScroll: true },
        );
    };

    const resetPassword = (user) => {
        if (
            !confirm(
                `Generate a new temporary password for ${user.name}?`,
            )
        ) {
            return;
        }

        router.post(
            route('employees.reset-password', user.id),
            {},
            { preserveScroll: true },
        );
    };

    const copyPassword = async () => {
        if (!credentials?.temp_password) {
            return;
        }

        await navigator.clipboard.writeText(
            credentials.temp_password,
        );

        setCopied(true);

        setTimeout(() => setCopied(false), 1500);
    };

    const showCredentials =
        credentials &&
        dismissed !== credentials.temp_password;

    const rows = employees.data;

    const menuItems = (user) => {
        const isSelf = user.id === auth.user.id;

        const items = [
            {
                label: 'Edit',
                onClick: () => setEditing(user),
            },
            {
                label: 'Detail',
                onClick: () => setDetail(user),
            },
        ];

        if (user.must_change_password) {
            items.push({
                label: 'Reset password',
                onClick: () => resetPassword(user),
            });
        }

        items.push({
            label:
                user.status === 'ACTIVE'
                    ? 'Deactivate'
                    : 'Activate',
            onClick: () => toggleStatus(user),
            danger: user.status === 'ACTIVE',
            disabled: isSelf,
            title: isSelf
                ? 'You cannot change your own status'
                : undefined,
            separatorBefore: true,
        });

        return items;
    };

    return (
        <AuthenticatedLayout header="Employees">
            <Head title="Employees" />

            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">
                        Employees
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage employee accounts and access.
                    </p>
                </div>

                <button
                    onClick={() => setCreateOpen(true)}
                    className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
                >
                    + New employee
                </button>
            </div>

            {/* Search */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-80">
                    <svg
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M9 3a6 6 0 1 0 3.874 10.583l3.771 3.772a1 1 0 0 0 1.414-1.414l-3.772-3.771A6 6 0 0 0 9 3Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
                            clipRule="evenodd"
                        />
                    </svg>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search employees..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>

                {search && (
                    <p className="text-xs text-slate-500">
                        Searching for{' '}
                        <span className="font-medium text-slate-700">
                            "{search}"
                        </span>
                    </p>
                )}
            </div>

            {/* Success */}
            {flash?.success && (
                <div className="mb-4 flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <span className="mr-2">✓</span>
                    {flash.success}
                </div>
            )}

            {/* One-time temporary credentials */}
            {showCredentials && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-amber-800">
                                Temporary credentials (shown only once)
                            </h3>

                            <p className="mt-1 text-xs text-amber-700/80">
                                Share these with the employee. Password
                                expires{' '}
                                {new Date(
                                    credentials.expires_at,
                                ).toLocaleString()}
                                .
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                setDismissed(
                                    credentials.temp_password,
                                )
                            }
                            className="text-xs text-amber-700/80 transition hover:text-amber-900"
                        >
                            Dismiss
                        </button>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-amber-200 bg-white p-3">
                            <dt className="text-xs text-slate-500">
                                Email
                            </dt>

                            <dd className="mt-1 truncate font-mono text-sm text-slate-900">
                                {credentials.email}
                            </dd>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-white p-3">
                            <dt className="text-xs text-slate-500">
                                Temporary password
                            </dt>

                            <dd className="mt-1 flex items-center gap-2">
                                <span className="truncate font-mono text-sm text-slate-900">
                                    {credentials.temp_password}
                                </span>

                                <button
                                    onClick={copyPassword}
                                    className="shrink-0 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-100"
                                >
                                    {copied
                                        ? 'Copied'
                                        : 'Copy'}
                                </button>
                            </dd>
                        </div>
                    </dl>
                </div>
            )}

            {/* Employee Table */}
            <div className="relative w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="w-full overflow-x-auto rounded-2xl">
                    <table className="w-full min-w-[950px] text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-4">
                                    Employee
                                </th>

                                <th className="hidden px-5 py-4 md:table-cell">
                                    Job title
                                </th>

                                <th className="px-5 py-4">
                                    Role
                                </th>

                                <th className="px-5 py-4">
                                    Status
                                </th>

                                <th className="hidden px-5 py-4 lg:table-cell">
                                    Password
                                </th>

                                <th className="px-5 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-14 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
                                                —
                                            </div>

                                            <p className="text-sm font-medium text-slate-700">
                                                {search
                                                    ? 'No employees found'
                                                    : 'No employees yet'}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {search
                                                    ? `No employees match "${search}".`
                                                    : 'Create an employee account to get started.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {rows.map((user, index) => {
                                const expired =
                                    user.must_change_password &&
                                    user.password_expires_at &&
                                    new Date(
                                        user.password_expires_at,
                                    ) < new Date();

                                const dropUp =
                                    rows.length > 3 &&
                                    index >= rows.length - 2;

                                return (
                                    <tr
                                        key={user.id}
                                        className="group relative transition hover:bg-slate-50"
                                    >
                                        {/* Employee */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt=""
                                                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-sm font-bold text-indigo-600">
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-800 group-hover:text-slate-950">
                                                        {user.name}
                                                    </p>

                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Job title */}
                                        <td className="hidden px-5 py-4 md:table-cell">
                                            <span className="text-sm text-slate-500">
                                                {user.job_title ||
                                                    '—'}
                                            </span>
                                        </td>

                                        {/* Role */}
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                                                    user.role ===
                                                    'SUPER_ADMIN'
                                                        ? 'border-purple-200 bg-purple-50 text-purple-700'
                                                        : 'border-slate-200 bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {user.role ===
                                                'SUPER_ADMIN'
                                                    ? 'Super Admin'
                                                    : 'Employee'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    user.status ===
                                                    'ACTIVE'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        user.status ===
                                                        'ACTIVE'
                                                            ? 'bg-emerald-500'
                                                            : 'bg-rose-500'
                                                    }`}
                                                />

                                                {user.status ===
                                                'ACTIVE'
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Password */}
                                        <td className="hidden px-5 py-4 lg:table-cell">
                                            {user.must_change_password ? (
                                                <span
                                                    className={
                                                        expired
                                                            ? 'inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700'
                                                            : 'inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700'
                                                    }
                                                >
                                                    {expired
                                                        ? 'Temp password expired'
                                                        : 'Temp password pending'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    Set by user
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="relative z-20 px-5 py-4 text-right">
                                            <div className="relative z-50 flex justify-end">
                                                <RowActionsMenu
                                                    items={menuItems(
                                                        user,
                                                    )}
                                                    dropUp={dropUp}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {employees.links.length > 3 && (
                    <div className="relative z-10 flex flex-wrap gap-1 border-t border-slate-200 p-4">
                        {employees.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                preserveScroll
                                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                        ? 'text-slate-600 hover:bg-slate-100'
                                        : 'pointer-events-none text-slate-300'
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateEmployeeModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                roles={roles}
            />

            {detail && (
                <EmployeeDetailModal
                    key={detail.id}
                    employee={detail}
                    onClose={() => setDetail(null)}
                />
            )}

            {editing && (
                <EditEmployeeModal
                    key={editing.id}
                    employee={editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

