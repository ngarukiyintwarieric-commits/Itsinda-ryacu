import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  rw: { translation: {
    brand: "ITSINDA RYACU", tagline: "Kwizigama hamwe, dutere imbere",
    overview: "Ahabanza", groups: "Amatsinda", savings: "Ubwizigame",
    loans: "Inguzanyo", mutuelle: "Mutuelle de Santé", pay: "Ishyura",
    history: "Amateka", news: "Amakuru", reports: "Raporo", members: "Abanyamuryango", penalties: "Ibihano n’amande", subscription: "Gahunda n’ubwishyu",
    welcome: "Murakaza neza", subtitle: "Menya uko ubwizigame bwawe buhagaze.",
    totalSavings: "Ubwizigame bwose", loanBalance: "Inguzanyo zisigaye",
    mutuelleGoal: "Intego ya Mutuelle", recentActivity: "Ibikorwa biheruka",
    demoNotice: "Iyi ni verisiyo y'igerageza. Amafaranga n'amakuru agaragara ni urugero gusa.",
    activity1: "Ubwizigame bw'icyumweru", activity2: "Intego ya Mutuelle yashyizweho",
    activity3: "Ubutumwa bushya bw'itsinda", demo: "Urugero", language: "Ururimi",
    amount: "Amafaranga", status: "Imiterere", date: "Itariki",
    planned: "Byateganyijwe", noPayment: "Nta bwishyu nyabwo bwakozwe.",
    comingSoon: "Iki gice kiri gutegurwa.", menu: "Menu"
  }},
  en: { translation: {
    brand: "ITSINDA RYACU", tagline: "Save together, grow together",
    overview: "Overview", groups: "Groups", savings: "Savings",
    loans: "Loans", mutuelle: "Community Health Insurance", pay: "Pay",
    history: "History", news: "News", reports: "Reports", members: "Members", penalties: "Penalties & fines", subscription: "Plans & billing",
    welcome: "Welcome", subtitle: "See how your savings are progressing.",
    totalSavings: "Total savings", loanBalance: "Outstanding loans",
    mutuelleGoal: "Mutuelle goal", recentActivity: "Recent activity",
    demoNotice: "Prototype only. Displayed balances and activity are examples.",
    activity1: "Weekly savings", activity2: "Mutuelle goal created",
    activity3: "New group announcement", demo: "Sample", language: "Language",
    amount: "Amount", status: "Status", date: "Date",
    planned: "Planned", noPayment: "No real payment has been made.",
    comingSoon: "This section is being prepared.", menu: "Menu"
  }},
  fr: { translation: {
    brand: "ITSINDA RYACU", tagline: "Épargner ensemble, avancer ensemble",
    overview: "Accueil", groups: "Groupes", savings: "Épargne",
    loans: "Prêts", mutuelle: "Mutuelle de santé", pay: "Payer",
    history: "Historique", news: "Actualités", reports: "Rapports", members: "Membres", penalties: "Pénalités et amendes", subscription: "Offres et paiement",
    welcome: "Bienvenue", subtitle: "Suivez l'évolution de votre épargne.",
    totalSavings: "Épargne totale", loanBalance: "Prêts en cours",
    mutuelleGoal: "Objectif Mutuelle", recentActivity: "Activités récentes",
    demoNotice: "Prototype uniquement. Les soldes et activités affichés sont des exemples.",
    activity1: "Épargne hebdomadaire", activity2: "Objectif Mutuelle créé",
    activity3: "Nouvelle annonce du groupe", demo: "Exemple", language: "Langue",
    amount: "Montant", status: "Statut", date: "Date",
    planned: "Prévu", noPayment: "Aucun paiement réel n'a été effectué.",
    comingSoon: "Cette section est en préparation.", menu: "Menu"
  }},
  sw: { translation: {
    brand: "ITSINDA RYACU", tagline: "Tuweke pamoja, tuendelee pamoja",
    overview: "Muhtasari", groups: "Vikundi", savings: "Akiba",
    loans: "Mikopo", mutuelle: "Bima ya afya ya jamii", pay: "Lipa",
    history: "Historia", news: "Habari", reports: "Ripoti", members: "Wanachama", penalties: "Faini na adhabu", subscription: "Mipango na malipo",
    welcome: "Karibu", subtitle: "Fuatilia maendeleo ya akiba yako.",
    totalSavings: "Akiba yote", loanBalance: "Mikopo inayodaiwa",
    mutuelleGoal: "Lengo la Mutuelle", recentActivity: "Shughuli za hivi karibuni",
    demoNotice: "Toleo la majaribio tu. Salio na shughuli zinazoonyeshwa ni mifano.",
    activity1: "Akiba ya wiki", activity2: "Lengo la Mutuelle limeundwa",
    activity3: "Tangazo jipya la kikundi", demo: "Mfano", language: "Lugha",
    amount: "Kiasi", status: "Hali", date: "Tarehe",
    planned: "Imepangwa", noPayment: "Hakuna malipo halisi yaliyofanywa.",
    comingSoon: "Sehemu hii inaandaliwa.", menu: "Menyu"
  }}
};

void i18n.use(initReactI18next).init({
  resources,
  lng: "rw",
  fallbackLng: "rw",
  interpolation: { escapeValue: false }
});

export default i18n;