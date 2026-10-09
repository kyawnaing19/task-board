import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ teams = [] }) {
    return (
        <AuthenticatedLayout header="My Teams">
            <Head title="My Teams" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        My Teams
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View and manage the teams you belong to.
                    </p>
                </div>

                {/* Empty State */}
                {teams.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                            <svg
                                className="h-7 w-7 text-indigo-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.7}
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            No teams yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                            You are not a member of any team yet. Once you join
                            a team, it will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Team Count */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Your teams
                            </p>

                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                                {teams.length}{' '}
                                {teams.length === 1 ? 'Team' : 'Teams'}
                            </span>
                        </div>

                        {/* Responsive Team Grid */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {teams.map((team) => (
                                <Link
                                    key={team.id}
                                    href={route('my-teams.show', team.id)}
                                    className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                                            <svg
                                                className="h-5 w-5"
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
                                            <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                                                {team.name}
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Team #{team.id}
                                            </p>
                                        </div>

                                        <svg
                                            className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>

                                    {/* Description */}
                                    <p className="mt-5 min-h-[3rem] line-clamp-2 text-sm leading-6 text-slate-500">
                                        {team.description || 'No description available.'}
                                    </p>

                                    {/* Card Footer */}
                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <svg
                                                className="h-4 w-4 text-slate-400"
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

                                            <span>
                                                {team.members_count ?? 0}{' '}
                                                {(team.members_count ?? 0) === 1
                                                    ? 'member'
                                                    : 'members'}
                                            </span>
                                        </div>

                                        <span className="text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                                            View team
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}