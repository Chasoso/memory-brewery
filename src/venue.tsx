import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// eslint-disable-next-line react-refresh/only-export-components -- Dedicated Vite entry point has no refresh exports.
function VenuePlaceholder() {
  return (
    <main>
      <h1>Memory Brewery</h1>
      <p>Local application foundation</p>
      <p>Venue entry</p>
    </main>
  );
}

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Venue root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <VenuePlaceholder />
  </StrictMode>,
);
