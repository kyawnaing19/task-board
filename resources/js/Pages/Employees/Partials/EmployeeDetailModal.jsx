export default function EmployeeDetailModal({ employee, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Employee Detail
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-5 p-6">

                    {employee.avatar && (
                        <div className="flex justify-center">
                            <img
                                src={employee.avatar}
                                alt={employee.name}
                                className="h-24 w-24 rounded-full object-cover"
                            />
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Name
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {employee.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Email
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            {employee.email}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Job Title
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            {employee.job_title || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Role
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            {employee.role || '—'}
                        </p>
                    </div>

                </div>

                <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}