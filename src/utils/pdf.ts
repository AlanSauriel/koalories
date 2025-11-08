import jsPDF from 'jspdf';
import { Profile, IntakeEntry, FoodItem } from '../types';
import { formatDate, getCurrentDateISO } from './date';
import { formatCalories } from './format';

interface PDFExportData {
  profile: Profile;
  date: string;
  entries: IntakeEntry[];
  foods: FoodItem[];
  totalConsumed: number;
}

export async function exportToPDF(data: PDFExportData): Promise<void> {
  const { profile, date, entries, foods, totalConsumed } = data;
  const doc = new jsPDF();
  
  const margin = 20;
  let yPos = margin;
  const lineHeight = 7;
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Calorías', margin, yPos);
  yPos += lineHeight * 2;
  
  // Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDate(date)}`, margin, yPos);
  yPos += lineHeight * 1.5;
  
  // Profile info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del perfil', margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${profile.name}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Edad: ${profile.age} años`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Peso: ${profile.weightKg} kg`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Altura: ${profile.heightCm} cm`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Meta calórica (TDEE): ${formatCalories(profile.tdee)}`, margin, yPos);
  yPos += lineHeight * 2;
  
  // Consumption summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del día', margin, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total consumido: ${formatCalories(totalConsumed)}`, margin, yPos);
  yPos += lineHeight;
  
  const difference = totalConsumed - profile.tdee;
  const diffText = difference > 0 
    ? `Excediste por: ${formatCalories(Math.abs(difference))}`
    : `Te faltaron: ${formatCalories(Math.abs(difference))}`;
  doc.text(diffText, margin, yPos);
  yPos += lineHeight;
  
  const percent = (totalConsumed / profile.tdee) * 100;
  let status = 'Dentro de la meta';
  if (percent > 105) status = 'Excedido';
  else if (percent > 95) status = 'Cerca de la meta';
  
  doc.text(`Estado: ${status}`, margin, yPos);
  yPos += lineHeight * 2;
  
  // Food list
  if (entries.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Alimentos consumidos', margin, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    entries.forEach((entry, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = margin;
      }
      
      const food = foods.find(f => f.id === entry.foodId);
      const name = food?.name || entry.customName || 'Alimento personalizado';
      const entryKcal = entry.kcalPerUnit * entry.units;
      
      doc.text(`${index + 1}. ${name}`, margin, yPos);
      yPos += lineHeight - 1;
      doc.setFont('helvetica', 'italic');
      doc.text(`   ${entry.kcalPerUnit} kcal × ${entry.units} = ${entryKcal} kcal`, margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += lineHeight;
    });
  }
  
  // Footer
  yPos = 280;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Demo educativa. No sustituye asesoría médica profesional.', margin, yPos);
  
  // Save
  const fileName = `reporte-calorias-${date}.pdf`;
  doc.save(fileName);
}
