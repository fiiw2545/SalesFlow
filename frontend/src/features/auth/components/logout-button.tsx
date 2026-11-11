import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { LogOut, LoaderCircle } from "lucide-react";

import { logout } from "../services/auth.service";
import { setActiveOrganizationId } from "../../organizations/stores/organization.store";

function LogoutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const clearSessionData = () => {
    setActiveOrganizationId(null);

    // Update authentication state first.
    queryClient.setQueryData(["auth", "me"], null);

    // Remove all non-auth cached data.
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== "auth",
    });
  };

  const logoutMutation = useMutation({
    mutationFn: logout,

    onMutate: async () => {
      await queryClient.cancelQueries();
      clearSessionData();
    },

    onSettled: () => {
      clearSessionData();
      navigate("/login", { replace: true });
    },
  });

  return (
    <button
      type="button"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {logoutMutation.isPending ? (
        <LoaderCircle size={18} className="animate-spin" />
      ) : (
        <LogOut size={18} />
      )}

      {logoutMutation.isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}

export default LogoutButton;
