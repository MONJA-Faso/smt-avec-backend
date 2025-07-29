import { Calculator } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">SMT</span>
              <span className="text-sm text-gray-500">
                Système Minimal de Trésorerie
              </span>
            </div>
            
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-500">
                © 2024 SMT. Conforme aux normes comptables OHADA.
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Fonctionnalités
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><span className="text-sm text-gray-600">Gestion de trésorerie</span></li>
                  <li><span className="text-sm text-gray-600">Livre recettes-dépenses</span></li>
                  <li><span className="text-sm text-gray-600">États financiers OHADA</span></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Support
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><span className="text-sm text-gray-600">Guide utilisateur</span></li>
                  <li><span className="text-sm text-gray-600">FAQ OHADA</span></li>
                  <li><span className="text-sm text-gray-600">Contact support</span></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Conformité
                </h3>
                <ul className="mt-4 space-y-2">
                  <li><span className="text-sm text-gray-600">Normes OHADA</span></li>
                  <li><span className="text-sm text-gray-600">Seuils TPE</span></li>
                  <li><span className="text-sm text-gray-600">Déclarations fiscales</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}