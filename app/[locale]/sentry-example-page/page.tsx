"use client";

import { useState } from "react";

export default function SentryExamplePage() {
  const [serverResponse, setServerResponse] = useState<string>("");

  const triggerClientError = () => {
    throw new Error("Test error dari client (Sentry client-side)");
  };

  const triggerServerError = async () => {
    try {
      const res = await fetch("/api/sentry-example-page");
      setServerResponse(`Status: ${res.status}`);
    } catch (err) {
      setServerResponse(
        `Error saat fetch: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Halaman Test Sentry</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Klik tombol untuk memicu error, lalu cek di Sentry dashboard.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={triggerClientError}
            className="w-full px-4 py-2.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Trigger Client Error
          </button>
          <button
            type="button"
            onClick={triggerServerError}
            className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Trigger Server Error
          </button>
        </div>

        {serverResponse && (
          <p className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
            {serverResponse}
          </p>
        )}
      </div>
    </main>
  );
}
