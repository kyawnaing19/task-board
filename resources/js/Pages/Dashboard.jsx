import React from 'react';
import { Head, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import EmployeeDashboard from '@/Components/Dashboard/EmployeeDashboard';
import AdminDashboard from '@/Components/Dashboard/AdminDashboard';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    return (
        <AuthenticatedLayout
            header={isSuperAdmin ? 'Admin Dashboard' : 'Dashboard Overview'}
        >
            <Head title={isSuperAdmin ? 'Admin Dashboard' : 'Dashboard'} />

            {isSuperAdmin ? (
                <AdminDashboard />
            ) : (
                <EmployeeDashboard />
            )}
        </AuthenticatedLayout>
    );
}