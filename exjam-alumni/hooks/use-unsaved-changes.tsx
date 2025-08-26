import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useUnsavedChanges(
  isDirty: boolean,
  message: string = "You have unsaved changes. Are you sure you want to leave?"
) {
  const router = useRouter();

  // Browser navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  // Next.js navigation warning
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (isDirty) {
        const confirmLeave = window.confirm(message);
        if (!confirmLeave) {
          router.push(window.location.pathname);
          throw "Route change aborted";
        }
      }
    };

    // Listen for route changes
    const originalPush = router.push;
    router.push = async (...args) => {
      if (isDirty) {
        const confirmLeave = window.confirm(message);
        if (!confirmLeave) {
          return Promise.resolve(false);
        }
      }
      return originalPush.apply(router, args);
    };

    return () => {
      router.push = originalPush;
    };
  }, [isDirty, message, router]);

  const confirmNavigation = useCallback(
    (callback: () => void) => {
      if (isDirty) {
        const modal = toast.custom(
          (t) => (
            <div className="max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h3 className="mb-2 text-lg font-semibold">Unsaved Changes</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-300">{message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                  }}
                  className="rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    callback();
                  }}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Leave Without Saving
                </button>
              </div>
            </div>
          ),
          {
            duration: Infinity,
            position: "top-center",
          }
        );
      } else {
        callback();
      }
    },
    [isDirty, message]
  );

  return { confirmNavigation };
}
