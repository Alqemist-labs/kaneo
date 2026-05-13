import { getApiUrl } from "@/fetchers/get-api-url";

export async function uploadUserAvatar(file: File): Promise<{ image: string }> {
  const form = new FormData();
  form.set("avatar", file);
  const res = await fetch(getApiUrl("user/profile/avatar"), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<{ image: string }>;
}

export async function deleteUserAvatar(): Promise<void> {
  const res = await fetch(getApiUrl("user/profile/avatar"), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}
