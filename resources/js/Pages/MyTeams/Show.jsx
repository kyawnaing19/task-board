import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';

export default function Show({ team, members = [] }) {
    return (
        <AuthenticatedLayout header="My Teams">
            <Head title={team.name} />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Back Navigation */}
                <Link
                    href={route('my-teams.index')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to my teams
                </Link>

                {/* Team Header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.7}
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </div>

                        <div className="min-w-0 flex-1">
                            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900">
                                {team.name}
                            </h1>

                            <p className="mt-2 text-sm text-slate-500">
                                {team.description || 'No description available.'}
                            </p>

                            <div className="mt-4">
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                                    {members.length}{' '}
                                    {members.length === 1 ? 'Member' : 'Members'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members Section */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Team Members
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                People who belong to this team.
                            </p>
                        </div>

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-600">
                            {members.length}
                        </span>
                    </div>

                    {/* Empty State */}
                    {members.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                <svg
                                    className="h-6 w-6 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.7}
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                No members found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                There are currently no members to display.
                            </p>
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-3">
                            {members.map((member) => (
                                <li
                                    key={member.id}
                                    className="flex min-w-0 items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:px-6"
                                >
                                    <Avatar
                                        name={member.name}
                                        src={member.avatar_url}
                                        className="h-11 w-11 shrink-0 text-sm"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {member.name}
                                            </p>

                                            {member.is_me && (
                                                <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                    You
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 truncate text-sm text-slate-500">
                                            {member.job_title || 'No job title'}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}