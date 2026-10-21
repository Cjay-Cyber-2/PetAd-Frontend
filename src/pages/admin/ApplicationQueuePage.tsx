import { useRoleGuard } from "../../hooks/useRoleGuard";
import AdminApprovalQueuePage from "../AdminApprovalQueuePage";

export default function ApplicationQueuePage() {
  const { isAdmin } = useRoleGuard();

  if (!isAdmin) {
    return (
      <div role="alert" className="mx-auto my-16 max-w-xl rounded-xl bg-red-50 p-6 text-center text-red-800">
        Administrator access is required to review applications.
      </div>
    );
  }

  return <AdminApprovalQueuePage />;
}
