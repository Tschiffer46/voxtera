export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} Voxtera — Every voice matters
        </p>
      </div>
    </footer>
  );
}
