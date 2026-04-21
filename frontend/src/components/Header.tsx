import { Briefcase } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Unificar Vagas
          </h1>
          <p className="text-indigo-200 text-sm">
            Todas as oportunidades em um só lugar
          </p>
        </div>
      </div>
    </header>
  );
}
