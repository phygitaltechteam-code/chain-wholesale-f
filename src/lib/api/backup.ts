import { api } from "@/utils/axios";
import { useMutation } from "@tanstack/react-query";

export const getBackFile = async (): Promise<Blob> => {
  try {
    const response = await api.get("/backup", {
      responseType: "blob",
    });

    if (!response) {
      throw new Error("Backup API returned empty data");
    }

    if (!(response instanceof Blob)) {
      console.error(
        "Expected Blob but received:",
        response
      );

      throw new Error(
        "Backup API did not return a valid SQL file"
      );
    }

    if (response.size === 0) {
      throw new Error("Backup file is empty");
    }   
    return response;
  } catch (error: any) {
    console.error(
      "========== BACKUP API ERROR =========="
    );

    console.error(error);

    console.error(
      "======================================"
    );

    throw new Error(
      error?.message ||
        "Failed to fetch database backup"
    );
  }
};


const getRestoreFile = async (
  formData: FormData
) => {
  try {
    const response = await api.post(
      "/backup/restore",
      formData
    );

    return response;
  } catch (error: any) {
    console.error(
      "========== RESTORE API ERROR =========="
    );

    console.error(error);

    console.error(
      "======================================="
    );

    throw new Error(
      error?.message ||
        "Failed to restore database backup"
    );
  }
};


export const useRestore = (
  queryClient: any
) => {
  return useMutation({
    mutationFn: getRestoreFile,

    onSuccess: () => {
      queryClient.invalidateQueries();
    },

    onError: (error) => {
      console.error(
        "Restore mutation error:",
        error
      );
    },
  });
};