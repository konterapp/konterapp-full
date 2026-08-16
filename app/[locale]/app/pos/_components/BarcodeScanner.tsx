"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, SwitchCamera } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
  isOpen: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ isOpen, onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("barcode-scanner-container");
  const isStartingRef = useRef(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      try {
        scannerRef.current.clear();
      } catch {
        // ignore clear errors
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async (cameraIndex: number) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    await stopScanner();

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        setError("Tidak ada kamera yang ditemukan");
        isStartingRef.current = false;
        return;
      }

      setCameras(devices);
      const safeIndex = cameraIndex < devices.length ? cameraIndex : 0;

      const scanner = new Html5Qrcode(containerRef.current, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        devices[safeIndex].id,
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
        },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // ignore scan failures (no barcode in frame)
        }
      );

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Permission")) {
        setError("Izin kamera ditolak. Silakan izinkan akses kamera di browser.");
      } else {
        setError("Gagal membuka kamera: " + message);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner(currentCameraIndex);
      }, 300);
      return () => clearTimeout(timer);
    }
    stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanner(nextIndex);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#142D52]" />
            <h3 className="font-semibold text-[#142D52]">Scan Barcode</h3>
          </div>
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                className="cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                title="Ganti kamera"
              >
                <SwitchCamera className="h-5 w-5" />
              </button>
            )}
            <button onClick={handleClose} className="cursor-pointer rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div
            id={containerRef.current}
            className="w-full overflow-hidden rounded-lg bg-gray-900"
            style={{ minHeight: "280px" }}
          />

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <p className="mt-3 text-center text-sm text-gray-500">Arahkan kamera ke barcode produk</p>
        </div>
      </div>
    </div>
  );
}
