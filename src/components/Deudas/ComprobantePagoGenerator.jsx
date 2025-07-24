// components/Deudas/ComprobantePagoGenerator.js
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import { saveAs } from "file-saver";

export async function generarComprobantePago({ 
  cliente, 
  vehiculo, 
  cuota, 
  pago,
  fechaEmision = new Date()
}) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Encabezado
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "COMPROBANTE DE PAGO",
                bold: true,
                size: 28,
              }),
            ],
            alignment: "center",
            spacing: { after: 200 },
          }),
          
          // Información de la empresa
          new Paragraph({
            children: [
              new TextRun({
                text: "AutoMarket",
                bold: true,
                size: 22,
              }),
            ],
            alignment: "center",
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Sistema de Gestión de Ventas",
                size: 18,
              }),
            ],
            alignment: "center",
            spacing: { after: 200 },
          }),
          
          // Datos del cliente
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Datos del Cliente",
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Nombre: ${cliente.nombre}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Documento: ${cliente.documento || 'No especificado'}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Teléfono: ${cliente.telefono || 'No especificado'}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 100 },
          }),
          
          // Datos del vehículo
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Datos del Vehículo",
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Marca: ${vehiculo.marca}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Modelo: ${vehiculo.modelo}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Patente: ${vehiculo.patente}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Año: ${vehiculo.anio || 'No especificado'}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 100 },
          }),
          
          // Detalles del pago
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Detalles del Pago",
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Concepto: Pago de ${cuota.metodo || 'cuota'}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Fecha de vencimiento: ${cuota.fechaVencimiento}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Monto total: $${cuota.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Monto abonado: $${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          pago.montoIntereses > 0 && new Paragraph({
            children: [
              new TextRun({
                text: `Intereses: $${pago.montoIntereses.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Método de pago: ${pago.metodoPago}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Fecha de pago: ${pago.fecha}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Observaciones: ${pago.observaciones || 'Ninguna'}`,
                size: 18,
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 100 },
          }),
          
          // Pie de documento
          new Paragraph({
            children: [
              new TextRun({
                text: "Documento generado automáticamente por el sistema AutoMarket",
                size: 14,
                italics: true,
              }),
            ],
            alignment: "center",
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Fecha de emisión: ${fechaEmision.toLocaleDateString('es-AR')}`,
                size: 14,
              }),
            ],
            alignment: "center",
          }),
        ].filter(Boolean), // Filtramos los elementos nulos (como los párrafos condicionales)
      },
    ],
  });

  // Generar el documento y descargarlo
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Comprobante_Pago_${cliente.nombre.replace(/\s+/g, '_')}_${pago.fecha.replace(/\//g, '-')}.docx`);
}