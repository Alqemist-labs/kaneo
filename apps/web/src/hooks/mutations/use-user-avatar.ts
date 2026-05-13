import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { deleteUserAvatar, uploadUserAvatar } from "@/fetchers/user/avatar";
import { toast } from "@/lib/toast";

export function invalidateUserAvatarConsumers(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["session"] });
  void queryClient.invalidateQueries({ queryKey: ["workspace", "full"] });
  void queryClient.invalidateQueries({ queryKey: ["workspace-users"] });
  void queryClient.invalidateQueries({ queryKey: ["active-workspace-users"] });
  void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  void queryClient.invalidateQueries({ queryKey: ["workspace-activities"] });
}

export function useUploadUserAvatar() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (file: File) => uploadUserAvatar(file),
    onSuccess: () => {
      invalidateUserAvatarConsumers(queryClient);
      toast.success(t("settings:informationPage.avatarUploadSuccess"));
    },
    onError: () => {
      toast.error(t("settings:informationPage.avatarUploadError"));
    },
  });
}

export function useDeleteUserAvatar() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: () => deleteUserAvatar(),
    onSuccess: () => {
      invalidateUserAvatarConsumers(queryClient);
      toast.success(t("settings:informationPage.avatarRemoveSuccess"));
    },
    onError: () => {
      toast.error(t("settings:informationPage.avatarRemoveError"));
    },
  });
}
