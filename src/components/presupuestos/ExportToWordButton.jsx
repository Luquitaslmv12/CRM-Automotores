import React from "react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { Download } from "lucide-react";

const ExportToWordButton = ({ presupuesto }) => {
  const exportToWord = (p) => {
    const diferenciaEsPositiva = p.diferenciaMonto > 0;
    const colorTexto = diferenciaEsPositiva ? "008000" : "FF0000";

    const toCurrency = (monto) => {
      const num = Number(monto);
      return !isNaN(num)
        ? num.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 2,
          })
        : "-";
    };

    const toDate = (timestamp) =>
      timestamp?.seconds
        ? new Date(timestamp.seconds * 1000).toLocaleString("es-AR")
        : "—";

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Presupuesto",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Fecha: ",
                  bold: true,
                  size: 24,
                }),
                new TextRun({
                  text: toDate(p.fecha),
                  size: 24,
                }),
              ],
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Cliente: ",
                  bold: true,
                  size: 28,
                }),
                new TextRun({
                  text:
                    p.clienteNombre && p.clienteApellido
                      ? `${p.clienteNombre} ${p.clienteApellido}`
                      : "-",
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Datos del Vehículo", bold: true }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph(`Vehículo: ${p.vehiculoInfo}`),
            new Paragraph(`Patente: ${p.patenteVehiculo}`),
            new Paragraph(`Estado: ${p.estadoVehiculo || "-"}`),
            new Paragraph(`Tipo: ${p.tipoVehiculo || "-"}`),
            new Paragraph(`N° Chasis: ${p.chasisVehiculo || "-"}`),
            new Paragraph(`N° Motor: ${p.motorVehiculo || "-"}`),
            new Paragraph(`Año: ${p.añoVehiculo || "-"}`),
            new Paragraph(`Valor Tazado: ${toCurrency(p.monto)}`),

            ...(p.parteDePago
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Vehículo Entregado en Parte de Pago",
                        bold: true,
                      }),
                    ],
                    spacing: { before: 300, after: 100 },
                  }),
                  new Paragraph(`Modelo: ${p.parteDePagoInfo || "-"}`),
                  new Paragraph(`Año: ${p.parteDePagoAño || "-"}`),
                  new Paragraph(`Patente: ${p.parteDePagoPatente || "-"}`),
                  new Paragraph(`Valor Tazado: ${p.parteDePagoMonto}`),

                  new Paragraph(
                    `Recibido por: ${p.parteDePagoRecibidoPor || "-"}`
                  ),
                  new Paragraph(
                    `Valor Tazado: ${toCurrency(p.parteDePagoMonto)}`
                  ),

                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Diferencia: ",
                        bold: true,
                        size: 28,
                      }),
                      new TextRun({
                        text: toCurrency(p.diferenciaMonto ?? 0),
                        bold: true,
                        size: 28,
                        color: colorTexto,
                      }),
                    ],
                    spacing: { after: 300, before: 200 },
                  }),

new Paragraph({
  children: [
    new TextRun({ text: "Métodos de Pago:", bold: true }),
  ],
  spacing: { before: 300, after: 100 },
}),
...(p.pagos && p.pagos.length > 0
  ? p.pagos.map((pago) =>
      new Paragraph(
        `- ${pago.metodo || "Sin método"}: ${toCurrency(pago.monto)}`
      )
    )
  : [new Paragraph("—")]),

  new Paragraph({
  children: [
    new TextRun({ text: "Observaciones:", bold: true }),
  ],
  spacing: { before: 300, after: 100 },
}),
new Paragraph(p.observaciones || "—"),  

                ]
              : []),

            new Paragraph({
              children: [
                new TextRun({ text: "Datos de la Operación", bold: true }),
              ],
              spacing: { before: 300, after: 100 },
            }),

            new Paragraph(`Tazado por: ${p.parteDePago?.recibidoPor || "—"}`),

            ...(p.modificadoPor
              ? [
                  new Paragraph(`Modificado por: ${p.modificadoPor}`),
                  new Paragraph(`Modificado en: ${toDate(p.modificadoEn)}`),
                ]
              : []),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(
        blob,
        `presupuesto_${p.vehiculoInfo}_${p.vehiculo || "vehiculo"}.docx`
      );
    });
  };

  return (
    <button
      onClick={() => exportToWord(presupuesto)}
      className="text-green-400 hover:text-green-600"
      title="Descargar detalles en Word"
    >
      <Download />
    </button>
  );
};

export default ExportToWordButton;
