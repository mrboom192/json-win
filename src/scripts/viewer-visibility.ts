// Keep this module free of Three.js so observing an embed is inexpensive.
export function whenNearViewport(element: HTMLElement, initialize: () => void) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      if (element.isConnected) initialize();
    },
    { rootMargin: "200px" },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
