import { Toaster as Sonner } from "sonner";

export default function Toaster() {
  return (
    <Sonner
      position="top-center"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center gap-2.5 rounded-2xl bg-ink text-white text-[13.5px] font-medium px-4 py-3 shadow-raised w-[calc(100vw-2rem)] max-w-[360px]",
          success: "bg-ink",
          error: "bg-rose-600",
        },
      }}
    />
  );
}
