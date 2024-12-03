export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        // First, try to unregister any existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }

        // Register the new service worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none", // Prevent cache issues on iOS
        });

        console.log("ServiceWorker registration successful");

        // Check for updates immediately
        await registration.update();

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                if (
                  confirm(
                    "A new version is available! Would you like to update?"
                  )
                ) {
                  newWorker.postMessage({ type: "skipWaiting" });
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("ServiceWorker registration failed:", error);
      }
    });

    // Handle updates when the user returns to the app
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
