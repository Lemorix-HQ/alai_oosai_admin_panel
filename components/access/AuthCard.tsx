export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-login-gradient min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-[420px] bg-white rounded-lg shadow-2xl p-10">
        <header className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-inner"
            style={{ backgroundColor: "#0d5c63" }}
          >
            <span className="text-white font-extrabold text-lg tracking-tighter">AO</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-center" style={{ color: "#0d5c63" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium mt-1 text-center" style={{ color: "#596065" }}>
              {subtitle}
            </p>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}
