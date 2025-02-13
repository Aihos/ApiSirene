import React, { useState } from 'react';
import { Search, Building2, Calendar } from 'lucide-react';

interface Company {
  siren: string;
  siret: string;
  denominationUniteLegale: string;
  dateCreationUniteLegale: string;
  categorieEntreprise: string;
}

const API_KEY = "1a3d1061-7d89-4c64-bd10-617d89ac64cd";

function App() {
  const [searchSiren, setSearchSiren] = useState('');
  const [searchSiret, setSearchSiret] = useState('');
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);

  // Valeurs par défaut pour les dates
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const [startDate, setStartDate] = useState(yearStart);
  const [endDate, setEndDate] = useState(today);

  const fetchCompanyData = async (type: 'siren' | 'siret', value: string) => {
    if (!value.trim()) {
      setError(`Veuillez entrer un numéro ${type.toUpperCase()} valide`);
      return;
    }
    
    setLoading(true);
    setError('');
    setCompany(null);

    try {
      const response = await fetch(`https://api.insee.fr/api-sirene/3.11/${type}/${value}`, {
        method: "GET",
        headers: {
          "X-INSEE-Api-Key-Integration": API_KEY,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const uniteLegale = data.uniteLegale;
      const etablissement = data.etablissements;
      
      if (!uniteLegale) {
        setError(`Aucune entreprise trouvée pour ce numéro ${type.toUpperCase()}`);
        return;
      }

      const companyData: Company = {
        siren: uniteLegale.siren || '',
        siret: etablissement?.siret || '',
        denominationUniteLegale: uniteLegale.denominationUniteLegale || 'Nom inconnu',
        dateCreationUniteLegale: uniteLegale.dateCreationUniteLegale || '',
        categorieEntreprise: uniteLegale.categorieEntreprise || 'Non spécifiée',
      };

      setCompany(companyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de récupération des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentCompanies = async () => {
    setLoading(true);
    setError('');
    setRecentCompanies([]);
  
    try {
      if (!startDate || !endDate) {
        throw new Error("Veuillez spécifier les dates de début et de fin.");
      }
      
      const response = await fetch(
        `https://api.insee.fr/api-sirene/3.11/siret?q=dateCreationEtablissement:[${startDate} TO ${endDate}]&etatAdministratifEtablissement:A&nombre=10000`, 
        {
          method: "GET",
          headers: {
            "X-INSEE-Api-Key-Integration": API_KEY,
            "Accept": "application/json"
          }
        }
      );
  
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log("Données reçues:", data);
  
      if (!data.etablissements || data.etablissements.length === 0) {
        throw new Error("Aucun établissement trouvé pour cette période.");
      }
  
      // Filtrer pour ne garder que les établissements dont le code postal commence par "53"
      const filteredEstabs = data.etablissements.filter((etab: any) => {
        const cp = etab.adresseEtablissement?.codePostalEtablissement;
        return cp && cp.startsWith("53");
      });
      
      const companies = filteredEstabs.map((etablissement: any) => ({
        siret: etablissement.siret || '',
        siren: etablissement.siren || '',
        denominationUniteLegale: etablissement.uniteLegale?.denominationUniteLegale || 'Nom inconnu',
        dateCreationUniteLegale: etablissement.dateCreationEtablissement || '',
        categorieEntreprise: etablissement.uniteLegale?.categorieEntreprise || 'Non spécifiée',
        adresse: `${etablissement.adresseEtablissement?.numeroVoieEtablissement || ''} ${etablissement.adresseEtablissement?.typeVoieEtablissement || ''} ${etablissement.adresseEtablissement?.libelleVoieEtablissement || ''} ${etablissement.adresseEtablissement?.codePostalEtablissement || ''} ${etablissement.adresseEtablissement?.libelleCommuneEtablissement || ''}`
      }));
  
      setRecentCompanies(companies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de récupération des données');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Recherche d'Entreprise</h1>
        
        {/* Recherche par SIREN */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchSiren}
            onChange={(e) => setSearchSiren(e.target.value)}
            placeholder="Entrez un numéro SIREN..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => fetchCompanyData('siren', searchSiren)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={20} /> {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
        
        {/* Recherche par SIRET */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchSiret}
            onChange={(e) => setSearchSiret(e.target.value)}
            placeholder="Entrez un numéro SIRET..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => fetchCompanyData('siret', searchSiret)}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={20} /> {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
        
        {/* Choix des dates */}
        <div className="flex gap-2 mb-4">
          <label className="flex flex-col">
            Date de début:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="flex flex-col">
            Date de fin:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg"
            />
          </label>
        </div>

        {/* Bouton pour lancer la recherche avec dates */}
        <button
          onClick={fetchRecentCompanies}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mt-4"
        >
          Afficher les entreprises créées entre ces dates
        </button>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

        {recentCompanies.length > 0 ? (
          <ul className="space-y-2">
            {recentCompanies.map((company, index) => (
              <li key={index} className="bg-white p-3 rounded-lg shadow flex flex-col">
                <span className="font-medium text-gray-900">{company.denominationUniteLegale}</span>
                <span className="text-gray-700">SIREN : {company.siren} | SIRET : {company.siret}</span>
                <span className="text-gray-500 text-sm">Créé le : {company.dateCreationUniteLegale}</span>
                <span className="text-gray-500 text-sm">Adresse : {company.adresse}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">Aucune entreprise trouvée pour cette période.</p>
        )}
      </div>
    </div>
  );
}

export default App;
