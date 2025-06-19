import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import "dayjs/locale/es";

const exportarBoletoDOCX = async (venta) => {
  const fecha = dayjs(venta.fechaObj).locale("es").format("DD [de] MMMM [de] YYYY");

  const contenido = `BOLETO DE COMPRAVENTA POR MANDATO

En la ciudad de Colón, a los ${fecha}, entre AUTOMOTORES LA TORTUGA, con domicilio real en San Martín 1147 de la ciudad de Colón, Departamento Colón, provincia de Entre Ríos, por parte vendedora y por la parte compradora ${venta.clienteNombre.toUpperCase()} ${venta.clienteApellido.toUpperCase()} D.N.I. N° ${venta.dniCliente}, domiciliado en ________________________, Teléfono: _______________________ EMAIL: ____________________________ Profesión/ocupación: ________________________, convienen en celebrar el presente boleto de compraventa, sujeto a las cláusulas que se exponen:

1) El comprador adquiere un vehículo: ${venta.vehiculoInfo}.
2) La venta se realiza por la diferencia entre vehículos pagaderos de la siguiente manera: el cliente entrega un vehículo de Marca: ____________ Modelo: ____________ Año: ______ Dominio: ____________ Chasis: ____________ Motor: ____________.
3) Con respecto a las patentes del vehículo, las mismas se encuentran al día al momento de la entrega de la unidad, haciéndose cargo el comprador de los futuros anticipos a vencer hasta el momento que se efectivice la transferencia.

Se firman dos ejemplares de un mismo tenor y a un solo efecto en el lugar y fechas arriba indicados.


              COMPRADOR                                             VENDEDOR`;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: contenido.split("\n").map((line) =>
          new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 200 },
          })
        ),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `boleto_compra_venta_${venta.clienteNombre}_${venta.clienteApellido}.docx`);
};


export default exportarBoletoDOCX;