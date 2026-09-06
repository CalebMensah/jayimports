import { BUSINESS } from "@/lib/constants";

export function WhatsAppButton() {
  const cleanPhone = BUSINESS.phone.replace(/^0/, "233"); // convert to international format for wa.me

  return (
    <a
      href={`https://wa.me/${cleanPhone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 bg-turquoise-dark text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-turquoise transition"
      aria-label="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4a8.94 8.94 0 0 0-7.75 13.4L3 21l3.7-1.28a8.86 8.86 0 0 0 4.33 1.12h.01a8.94 8.94 0 0 0 6.56-15.52ZM12.05 19.4h-.01a7.42 7.42 0 0 1-3.77-1.03l-.27-.16-2.8.96.94-2.73-.17-.28a7.44 7.44 0 0 1 11.68-9.2 7.31 7.31 0 0 1 2.19 5.24 7.45 7.45 0 0 1-7.79 7.2Zm4.08-5.55c-.22-.11-1.32-.65-1.53-.73-.2-.08-.35-.11-.5.11-.15.22-.58.73-.71.88-.13.15-.26.16-.48.05-.22-.11-.94-.35-1.79-1.11a6.7 6.7 0 0 1-1.24-1.54c-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.39.06-.59.28-.2.22-.77.75-.77 1.83s.79 2.12.9 2.27c.11.15 1.55 2.37 3.76 3.32.53.23.94.36 1.26.47.53.17 1.01.14 1.39.09.42-.06 1.32-.54 1.51-1.06.19-.52.19-.97.13-1.06-.06-.09-.2-.15-.42-.26Z" />
      </svg>
    </a>
  );
}