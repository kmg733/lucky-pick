export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>&copy; {currentYear} Lucky Pick. 모든 추첨은 공정하게 진행됩니다.</p>
        </div>
      </div>
    </footer>
  );
}
