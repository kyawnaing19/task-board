import React from 'react';
import { Head, Link } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';

export default function Show({ team, members = [] }) {
    return (
        
            <AuthenticatedLayout
                header={
                    <nav
                        aria-label="Breadcrumb"
                        className="flex min-w-0 items-center gap-2 text-sm"
                    >
                        {/* Parent Breadcrumb */}
                        <Link
                            href={route('my-teams.index')}
                            className="shrink-0 font-medium text-slate-500 transition-colors hover:text-indigo-600"
                        >
                            My Teams
                        </Link>

                        {/* Separator */}
                        <svg
                            className="h-4 w-4 shrink-0 text-slate-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m9 18 6-6-6-6"
                            />
                        </svg>

                        {/* Current Team */}
                        <span
                            aria-current="page"
                            className="truncate font-semibold text-slate-900"
                        >
                            {team.name}
                        </span>
                    </nav>
                }
            >

            <Head title={team.name} />

            <div className="space-y-6">
                {/* Team Header */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-5 sm:p-7">
                        <div className="flex items-start gap-4">
                            {/* Team Icon */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
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

                            {/* Team Details */}
                            <div className="min-w-0 flex-1">
                                <h2 className="break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {team.name}
                                </h2>

                                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-500">
                                    {team.description ||
                                        'No description available.'}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 015.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 01.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>

                                        {members.length}{' '}
                                        {members.length === 1
                                            ? 'Member'
                                            : 'Members'}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                        <svg
                                            className="h-3.5 w-3.5"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path d="M5 16L3 5l5 4 4-6 4 6 5-4-2 11H5zm0 2h14v2H5v-2z" />
                                        </svg>

                                        Team
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Members */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Section Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-slate-900">
                                Team Members
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                People who belong to this team.
                            </p>
                        </div>

                        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 px-2.5 text-sm font-semibold text-slate-600">
                            {members.length}
                        </span>
                    </div>

                    {/* Empty State */}
                    {members.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-inset ring-slate-200">
                                <svg
                                    className="h-7 w-7 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.6}
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
                        <ul className="divide-y divide-slate-100">
                            {members.map((member) => (
                                <li
                                    key={member.id}
                                    className={`flex items-center gap-3 px-5 py-4 transition-colors sm:gap-4 sm:px-6 ${
                                        member.is_leader
                                            ? 'bg-amber-50/30'
                                            : 'hover:bg-slate-50'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <Avatar
                                            name={member.name}
                                            src={member.avatar_url}
                                            className="h-11 w-11 text-sm"
                                        />

                                        {/* Leader Crown Indicator */}
                                        {member.is_leader && (
                                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white ring-2 ring-white">
                                                <svg
                                                    className="h-3 w-3"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                    aria-label="Team Leader"
                                                >
                                                    <path d="M5 16L3 5l5 4 4-6 4 6 5-4-2 11H5zm0 2h14v2H5v-2z" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>

                                    {/* Member Information */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {member.name}
                                            </p>

                                            {/* You Badge */}
                                            {member.is_me && (
                                                <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100">
                                                    You
                                                </span>
                                            )}

                                            {/* Team Leader Badge */}
                                            {member.is_leader && (
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                                    <svg
                                                        className="h-3.5 w-3.5"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M5 16L3 5l5 4 4-6 4 6 5-4-2 11H5zm0 2h14v2H5v-2z" />
                                                    </svg>

                                                    Team Leader
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 truncate text-sm text-slate-500">
                                            {member.job_title ||
                                                'No job title'}
                                        </p>
                                    </div>

                                    {/* Member Role */}
                                    {member.is_leader ? (
                                        <div className="hidden shrink-0 text-right sm:block">
                                            <p className="text-xs font-semibold text-amber-700">
                                                Team Leader
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Leadership
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="hidden shrink-0 text-xs font-medium text-slate-400 sm:block">
                                            Team Member
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
