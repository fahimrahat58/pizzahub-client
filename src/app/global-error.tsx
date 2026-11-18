"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff8ef", color: "#2b1a12", fontFamily: "Inter, Arial, sans-serif", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, margin: "0 auto 20px", display: "grid", placeItems: "center", borderRadius: 16, background: "#d9481f1a", color: "#d9481f", fontSize: 28 }}>
            🍕
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d9481f" }}>
            PizzaHub hit an oven error
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 30, lineHeight: 1.15 }}>
            The app needs a fresh start
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.6, color: "#6b584c" }}>
            {error instanceof Error && error.message ? error.message : "An unexpected error prevented the page from loading."}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ border: 0, borderRadius: 10, background: "#d9481f", color: "white", padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
