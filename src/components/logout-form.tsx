export function LogoutForm() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-semibold"
        type="submit"
      >
        تسجيل الخروج
      </button>
    </form>
  );
}
