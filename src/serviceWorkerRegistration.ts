export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        let refreshing = false;
        const activateWaitingWorker = (registration: ServiceWorkerRegistration) => {
          registration.waiting?.postMessage({ type: "skipWaiting" });
        };

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });

        console.log("ServiceWorker registration successful");

        activateWaitingWorker(registration);
        await registration.update();

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                activateWaitingWorker(registration);
              }
            });
          }
        });

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            void registration.update();
          }
        });

        window.addEventListener("focus", () => {
          void registration.update();
        });
      } catch (error) {
        console.error("ServiceWorker registration failed:", error);
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
