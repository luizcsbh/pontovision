import { Injectable } from '@nestjs/common';
import { CalendarService } from '../calendar/calendar.service';
import { AuthService } from '../auth/auth.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';
import { minutesToTimeString, calculateExpirationDate } from '@pontovision/shared';

@Injectable()
export class ReportsService {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly authService: AuthService,
  ) {}

  async generateJsonReport(userId: string, month: string) {
    const user = await this.authService.getProfile(userId);
    const monthData = await this.calendarService.getMonthData(userId, month);
    return {
      user,
      monthData,
      generatedAt: new Date(),
    };
  }

  async generateCsvReport(userId: string, month: string): Promise<string> {
    const data = await this.calendarService.getMonthData(userId, month);
    const rows = data.days.map((d) => {
      const punches = d.calculation.entries.map((e) => e.time).join(' | ');
      const expDate = d.calculation.balanceMinutes > 0
        ? (d.calculation.expirationDate || calculateExpirationDate(d.date, 6))
        : '-';
      return [
        d.date,
        punches || 'Sem batidas',
        minutesToTimeString(d.calculation.totalWorkedMinutes),
        minutesToTimeString(d.calculation.expectedWorkMinutes),
        minutesToTimeString(d.calculation.balanceMinutes, true),
        expDate,
        d.isHoliday ? `Feriado: ${d.holidayName}` : d.calculation.isIncomplete ? 'Incompleto' : 'Regular',
      ];
    });

    return stringify(
      [
        ['Data', 'Marcações', 'Horas Trabalhadas', 'Horas Previstas', 'Saldo', 'Vencimento (+6m)', 'Observações'],
        ...rows,
      ],
      { delimiter: ';' },
    );
  }

  async generateExcelReport(userId: string, month: string): Promise<Buffer> {
    const user = await this.authService.getProfile(userId);
    const data = await this.calendarService.getMonthData(userId, month);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Espelho ${month}`);

    // Header info
    sheet.addRow(['PONTOVISION AI — ESPELHO DE PONTO VIRTUAL']);
    sheet.addRow([`Colaborador: ${user.name}`, `CPF: ${user.cpfMasked}`, `Mês: ${month}`]);
    sheet.addRow(['Regra CLT Art. 59 § 5º: Horas extras têm validade de 6 meses para compensação ou pagamento com adicional.']);
    sheet.addRow([]);

    // Table Header
    const headerRow = sheet.addRow([
      'Data',
      'Marcações',
      'Horas Realizadas',
      'Horas Previstas',
      'Saldo',
      'Vencimento CLT (+6m)',
      'Status',
    ]);
    headerRow.font = { bold: true };

    data.days.forEach((d) => {
      const punches = d.calculation.entries.map((e) => e.time).join(' - ');
      const expDate = d.calculation.balanceMinutes > 0
        ? (d.calculation.expirationDate || calculateExpirationDate(d.date, 6))
        : '-';

      sheet.addRow([
        d.date,
        punches || '-',
        minutesToTimeString(d.calculation.totalWorkedMinutes),
        minutesToTimeString(d.calculation.expectedWorkMinutes),
        minutesToTimeString(d.calculation.balanceMinutes, true),
        expDate,
        d.isHoliday ? `Feriado (${d.holidayName})` : d.calculation.isIncomplete ? 'Incompleto' : 'Normal',
      ]);
    });

    sheet.addRow([]);
    const expSummary = data.earliestExpirationDate
      ? data.earliestExpirationDate === data.latestExpirationDate
        ? `Vcto: ${data.earliestExpirationDate}`
        : `Vcto: ${data.earliestExpirationDate} a ${data.latestExpirationDate}`
      : '-';

    const summaryRow = sheet.addRow([
      'TOTAIS DO MÊS',
      '',
      minutesToTimeString(data.totalWorkedMinutes),
      minutesToTimeString(data.totalExpectedMinutes),
      minutesToTimeString(data.balanceMinutes, true),
      expSummary,
      `Dias Incompletos: ${data.incompleteDaysCount}`,
    ]);
    summaryRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generatePdfReport(userId: string, month: string): Promise<Uint8Array> {
    const user = await this.authService.getProfile(userId);
    const data = await this.calendarService.getMonthData(userId, month);

    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    let y = height - 50;

    // Cabeçalho
    page.drawText('PONTOVISION AI — ESPELHO DE PONTO VIRTUAL', {
      x: 50,
      y,
      size: 16,
      font: timesBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    y -= 25;

    page.drawText(`Colaborador: ${user.name}   |   CPF: ${user.cpfMasked}   |   Período: ${month}`, {
      x: 50,
      y,
      size: 10,
      font: timesRoman,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 30;

    // Cabeçalho da tabela
    page.drawText('Data', { x: 50, y, size: 9, font: timesBold });
    page.drawText('Marcações Registradas', { x: 120, y, size: 9, font: timesBold });
    page.drawText('Trabalhado', { x: 300, y, size: 9, font: timesBold });
    page.drawText('Previsto', { x: 370, y, size: 9, font: timesBold });
    page.drawText('Saldo', { x: 440, y, size: 9, font: timesBold });
    page.drawText('Status', { x: 500, y, size: 9, font: timesBold });
    y -= 15;

    // Linha separadora
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 15;

    for (const d of data.days) {
      if (y < 60) break; // limite da página
      const punches = d.calculation.entries.map((e) => e.time).join(' ') || '-';

      page.drawText(d.date.slice(5), { x: 50, y, size: 8, font: timesRoman });
      page.drawText(punches.slice(0, 32), { x: 120, y, size: 8, font: timesRoman });
      page.drawText(minutesToTimeString(d.calculation.totalWorkedMinutes), { x: 300, y, size: 8, font: timesRoman });
      page.drawText(minutesToTimeString(d.calculation.expectedWorkMinutes), { x: 370, y, size: 8, font: timesRoman });
      page.drawText(minutesToTimeString(d.calculation.balanceMinutes, true), { x: 440, y, size: 8, font: timesRoman });
      page.drawText(d.isHoliday ? 'Feriado' : d.calculation.isIncomplete ? 'Incompleto' : 'OK', { x: 500, y, size: 8, font: timesRoman });

      y -= 18;
    }

    // Totais no rodapé
    y -= 10;
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;

    page.drawText(
      `Totais: Realizado: ${minutesToTimeString(data.totalWorkedMinutes)}  |  Previsto: ${minutesToTimeString(data.totalExpectedMinutes)}  |  Saldo: ${minutesToTimeString(data.balanceMinutes, true)}`,
      { x: 50, y, size: 10, font: timesBold, color: rgb(0.1, 0.2, 0.4) },
    );

    if (data.balanceMinutes > 0 && data.earliestExpirationDate) {
      y -= 14;
      const expRange = data.earliestExpirationDate === data.latestExpirationDate
        ? data.earliestExpirationDate
        : `${data.earliestExpirationDate} a ${data.latestExpirationDate}`;
      page.drawText(
        `Banco de Horas (Art. 59 § 5º da CLT): Vencimento em 6 meses (a partir de cada marcação): ${expRange}`,
        { x: 50, y, size: 8, font: timesRoman, color: rgb(0.1, 0.4, 0.2) },
      );
    }

    return pdfDoc.save();
  }
}
