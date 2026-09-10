import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import Toaster from "../ui/Toaster.jsx";
import { AppointmentsProvider, useAppointments } from "../../../context/AppointmentsContext.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";

function AdminShellContent() {
  const { loading } = useAppointments();
  return (
    <div className="admin-app min-h-dvh bg-canvas">
      <Sidebar />
      <div className="min-h-dvh lg:pl-64">
        <main className="pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
          {loading ? (
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-8 lg:pt-8">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <div className="flex gap-3">
                <Skeleton className="h-20 flex-1 rounded-2xl" />
                <Skeleton className="h-20 flex-1 rounded-2xl" />
                <Skeleton className="h-20 flex-1 rounded-2xl" />
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <BottomNav />
      <Toaster />
    </div>
  );
}

export default function AdminShell() {
  return (
    <AppointmentsProvider>
      <AdminShellContent />
    </AppointmentsProvider>
  );
}
