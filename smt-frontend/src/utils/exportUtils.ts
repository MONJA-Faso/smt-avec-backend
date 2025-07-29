// Utilitaires pour l'export de données et rapports
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types
interface ExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3' | 'letter';
}

// Formatage des montants
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

// Export PDF d'un élément HTML
export async function exportToPDF(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'export-smt.pdf',
    orientation = 'portrait',
    format = 'a4'
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Élément avec l'ID "${elementId}" non trouvé`);
    }

    // Configuration pour une meilleure qualité
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF(orientation, 'mm', format);
    
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
}

// Export CSV pour les transactions
export function exportTransactionsToCSV(transactions: any[], filename = 'transactions.csv'): void {
  const headers = [
    'Date',
    'Type',
    'Description',
    'Catégorie',
    'Sous-catégorie',
    'Compte',
    'Montant',
    'Référence'
  ];

  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      new Date(t.date).toLocaleDateString('fr-FR'),
      t.type === 'recette' ? 'Recette' : 'Dépense',
      `"${t.description}"`,
      `"${t.category || ''}"`,
      `"${t.subcategory || ''}"`,
      `"${t.accountId}"`,
      t.amount.toString(),
      `"${t.reference || ''}"`
    ].join(','))
  ].join('\n');

  downloadCSV(csvContent, filename);
}

// Export CSV pour le livre recettes-dépenses
export function exportBooksToCSV(transactions: any[], filename = 'livre-recettes-depenses.csv'): void {
  const headers = [
    'Date',
    'N° Pièce',
    'Libellé',
    'Catégorie',
    'Compte',
    'Recettes',
    'Dépenses',
    'Solde'
  ];

  let solde = 0;
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => {
      if (t.type === 'recette') {
        solde += t.amount;
      } else {
        solde -= t.amount;
      }

      return [
        new Date(t.date).toLocaleDateString('fr-FR'),
        `"${t.reference || ''}"`,
        `"${t.description}"`,
        `"${t.category || ''}"`,
        `"${t.accountId}"`,
        t.type === 'recette' ? t.amount.toString() : '',
        t.type === 'depense' ? t.amount.toString() : '',
        solde.toString()
      ].join(',');
    })
  ].join('\n');

  downloadCSV(csvContent, filename);
}

// Fonction helper pour télécharger un CSV
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Génération PDF du compte de résultat
export async function generateIncomeStatementPDF(
  recettes: any[],
  depenses: any[],
  dateFrom: string,
  dateTo: string
): Promise<void> {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // En-tête
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPTE DE RÉSULTAT', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Période du ${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' });
  
  let yPosition = 50;
  
  // Recettes
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RECETTES', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const recettesParCategorie = recettes.reduce((acc: any, t: any) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  
  Object.entries(recettesParCategorie).forEach(([category, amount]: [string, any]) => {
    pdf.text(category, 25, yPosition);
    pdf.text(formatCurrency(amount), pageWidth - 50, yPosition, { align: 'right' });
    yPosition += 6;
  });
  
  const totalRecettes = recettes.reduce((sum, t) => sum + t.amount, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL RECETTES', 25, yPosition);
  pdf.text(formatCurrency(totalRecettes), pageWidth - 50, yPosition, { align: 'right' });
  yPosition += 20;
  
  // Dépenses
  pdf.setFontSize(14);
  pdf.text('DÉPENSES', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const depensesParCategorie = depenses.reduce((acc: any, t: any) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  
  Object.entries(depensesParCategorie).forEach(([category, amount]: [string, any]) => {
    pdf.text(category, 25, yPosition);
    pdf.text(formatCurrency(amount), pageWidth - 50, yPosition, { align: 'right' });
    yPosition += 6;
  });
  
  const totalDepenses = depenses.reduce((sum, t) => sum + t.amount, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL DÉPENSES', 25, yPosition);
  pdf.text(formatCurrency(totalDepenses), pageWidth - 50, yPosition, { align: 'right' });
  yPosition += 20;
  
  // Résultat
  const resultat = totalRecettes - totalDepenses;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RÉSULTAT', 25, yPosition);
  pdf.text(formatCurrency(resultat), pageWidth - 50, yPosition, { align: 'right' });
  
  // Conformité OHADA
  yPosition += 30;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Document généré selon les normes comptables OHADA', pageWidth / 2, yPosition, { align: 'center' });
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par SMT`, pageWidth / 2, yPosition + 5, { align: 'center' });
  
  pdf.save(`compte-resultat-${dateFrom}-${dateTo}.pdf`);
}

// Génération PDF du bilan
export async function generateBalanceSheetPDF(
  accounts: any[],
  dateFrom: string,
  dateTo: string
): Promise<void> {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // En-tête
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILAN SMT', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Au ${new Date(dateTo).toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' });
  
  let yPosition = 50;
  
  // ACTIF
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ACTIF', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Trésorerie', 25, yPosition);
  yPosition += 8;
  
  let totalActif = 0;
  accounts.forEach(account => {
    if (account.balance > 0) {
      pdf.text(`  ${account.name}`, 30, yPosition);
      pdf.text(formatCurrency(account.balance), 100, yPosition, { align: 'right' });
      totalActif += account.balance;
      yPosition += 6;
    }
  });
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL ACTIF', 25, yPosition);
  pdf.text(formatCurrency(totalActif), 100, yPosition, { align: 'right' });
  
  // PASSIF (côté droit)
  yPosition = 65;
  pdf.text('PASSIF', pageWidth / 2 + 20, 50);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Capitaux propres', pageWidth / 2 + 25, yPosition);
  yPosition += 8;
  
  const totalTresorerie = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  pdf.text('  Capital', pageWidth / 2 + 30, yPosition);
  pdf.text(formatCurrency(totalTresorerie), pageWidth - 30, yPosition, { align: 'right' });
  yPosition += 10;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL PASSIF', pageWidth / 2 + 25, yPosition);
  pdf.text(formatCurrency(totalTresorerie), pageWidth - 30, yPosition, { align: 'right' });
  
  // Note de conformité
  yPosition += 30;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Bilan simplifié conforme au Système Minimal de Trésorerie (OHADA)', pageWidth / 2, yPosition, { align: 'center' });
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par SMT`, pageWidth / 2, yPosition + 5, { align: 'center' });
  
  pdf.save(`bilan-smt-${dateTo}.pdf`);
}