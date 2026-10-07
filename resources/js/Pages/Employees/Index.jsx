import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateEmployeeModal from './Partials/CreateEmployeeModal';
import EditEmployeeModal from './Partials/EditEmployeeModal';
import RowActionsMenu from './Partials/RowActionsMenu';

export default function Index({ employees, roles }) {
    const { auth, flash } = usePage().props;
    const credentials = flash?.credentials;

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [dismissed, setDismissed] = useState(null);
    const [copied, setCopied] = useState(false);

    const toggleStatus = (user) => {
        const next = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const label = next === 'INACTIVE' ? 'deactivate' : 'activate';

        if (!confirm(`Are you sure you want to ${label} ${user.name}?`)) {
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
        await navigator.clipboard.writeText(credentials.temp_password);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const showCredentials =
        credentials && dismissed !== credentials.temp_password;

    const rows = employees.data;

    const menuItems = (user) => {
        const isSelf = user.id === auth.user.id;

        const items = [
            {
                label: 'Edit',
                onClick: () => setEditing(user),
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
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-white">
                        Employees
                    </h1>

                    <p className="mt-1 text-sm text-slate-400">
                        Manage employee accounts and access.
                    </p>
                </div>

                <button
                    onClick={() => setCreateOpen(true)}
                    className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
                >
                    + New employee
                </button>
            </div>

            {/* Success */}
            {flash?.success && (
                <div className="mb-4 flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    <span className="mr-2">✓</span>
                    {flash.success}
                </div>
            )}

            {/* One-time temporary credentials */}
            {showCredentials && (
                <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-semibold text-amber-300">
                                Temporary credentials (shown only once)
                            </h3>

                            <p className="mt-1 text-xs text-amber-200/70">
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
                                setDismissed(credentials.temp_password)
                            }
                            className="text-xs text-amber-200/70 transition hover:text-amber-100"
                        >
                            Dismiss
                        </button>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-amber-500/10 bg-slate-950/20 p-3">
                            <dt className="text-xs text-slate-400">
                                Email
                            </dt>

                            <dd className="mt-1 truncate font-mono text-sm text-slate-100">
                                {credentials.email}
                            </dd>
                        </div>

                        <div className="rounded-xl border border-amber-500/10 bg-slate-950/20 p-3">
                            <dt className="text-xs text-slate-400">
                                Temporary password
                            </dt>

                            <dd className="mt-1 flex items-center gap-2">
                                <span className="truncate font-mono text-sm text-slate-100">
                                    {credentials.temp_password}
                                </span>

                                <button
                                    onClick={copyPassword}
                                    className="shrink-0 rounded-lg border border-slate-700 px-2 py-0.5 text-xs text-slate-300 transition hover:bg-slate-800"
                                >
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </dd>
                        </div>
                    </dl>
                </div>
            )}

            {/* Employee Table */}
            <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[950px] text-sm">
                        <thead className="border-b border-slate-800 bg-slate-950/40">
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

                        <tbody className="divide-y divide-slate-800/80">
                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-14 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl text-slate-500">
                                                —
                                            </div>

                                            <p className="text-sm font-medium text-slate-300">
                                                No employees yet
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Create an employee account
                                                to get started.
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

                                // အောက်ဆုံး ၂ တန်းမှာ menu ကို အပေါ်ဘက်ကို ဖွင့်မယ်
                                const dropUp =
                                    rows.length > 3 &&
                                    index >= rows.length - 2;

                                return (
                                    <tr
                                        key={user.id}
                                        className="group transition hover:bg-slate-800/30"
                                    >
                                        {/* Employee */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt=""
                                                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-700"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm font-bold text-indigo-400">
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-200 group-hover:text-white">
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
                                            <span className="text-sm text-slate-400">
                                                {user.job_title || '—'}
                                            </span>
                                        </td>

                                        {/* Role */}
                                       
<td className="px-5 py-4">
    <span
        className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium ${
            user.role === 'SUPER_ADMIN'
                ? 'border-purple-500/20 bg-purple-500/10 text-purple-300'
                : 'border-slate-700 bg-slate-800/80 text-slate-300'
        }`}
    >
        {user.role === 'SUPER_ADMIN'
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
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-rose-500/10 text-rose-400'
                                                }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        user.status ===
                                                        'ACTIVE'
                                                            ? 'bg-emerald-400'
                                                            : 'bg-rose-400'
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
                                                            ? 'inline-flex rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400'
                                                            : 'inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400'
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
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end">
                                                <RowActionsMenu
                                                    items={menuItems(user)}
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
                    <div className="flex flex-wrap gap-1 border-t border-slate-800 p-4">
                        {employees.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                preserveScroll
                                className={`rounded-lg px-3 py-1.5 text-xs transition ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                        ? 'text-slate-300 hover:bg-slate-800'
                                        : 'pointer-events-none text-slate-600'
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

