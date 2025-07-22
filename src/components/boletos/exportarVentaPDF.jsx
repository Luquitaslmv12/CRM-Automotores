import { jsPDF } from "jspdf";
import dayjs from "dayjs";
import "dayjs/locale/es";

export default function exportarVentaPDF(venta) {
  if (!venta) return;

  // Configuración del documento
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Estilos
  const primaryColor = "#3B82F6"; // Azul
  const secondaryColor = "#6B7280"; // Gris
  const accentColor = "#10B981"; // Verde
  const textColor = "#1F2937"; // Gris oscuro
  const borderColor = "#E5E7EB"; // Gris claro

  // Margenes
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 20;
  let currentY = marginTop;

  // Fuentes (necesitarás agregar las fuentes que quieras usar)
  doc.setFont("helvetica", "normal");

  // Logo y encabezado
  const addHeader = () => {
    // Logo (puedes reemplazar esto con tu logo en base64)
    // doc.addImage(logo, 'PNG', marginLeft, currentY, 40, 15);
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(primaryColor);
    doc.text("COMPROBANTE DE VENTA", 105, currentY + 10, { align: "center" });
    
   
    
    // Fecha
    doc.text(
      `Fecha: ${dayjs(venta.fechaObj).locale("es").format("DD/MM/YYYY")}`,
      190,
      currentY + 25,
      { align: "right" }
    );
    
    currentY += 25;
  };

  // Sección Cliente
  const addClienteSection = () => {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("DATOS DEL CLIENTE", marginLeft, currentY);
    currentY += 7;

    doc.setDrawColor(borderColor);
    doc.line(marginLeft, currentY, 200 - marginRight, currentY);
    currentY += 5;

    doc.setFontSize(11);
    doc.setTextColor(textColor);

    // Nombre
    doc.text(`Nombre: ${venta.clienteNombre} ${venta.clienteApellido}`, marginLeft, currentY);
    currentY += 6;

    // DNI
    if (venta.dniCliente) {
      doc.text(`DNI: ${venta.dniCliente}`, marginLeft, currentY);
      currentY += 6;
    }

    // Contacto
    const contactInfo = [];
    if (venta.telefonoCliente) contactInfo.push(`Tel: ${venta.telefonoCliente}`);
    if (venta.emailCliente) contactInfo.push(`Email: ${venta.emailCliente}`);

    if (contactInfo.length > 0) {
      doc.text(`Contacto: ${contactInfo.join(" | ")}`, marginLeft, currentY);
      currentY += 6;
    }

    // Dirección
    if (venta.clienteDireccion) {
      const direccion = venta.localidadCliente 
        ? `${venta.clienteDireccion}, ${venta.localidadCliente}`
        : venta.clienteDireccion;
      doc.text(`Dirección: ${direccion}`, marginLeft, currentY);
      currentY += 6;
    }

    currentY += 5;
  };

  // Sección Vehículo
  const addVehiculoSection = () => {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("VEHÍCULO VENDIDO", marginLeft, currentY);
    currentY += 7;

    doc.setDrawColor(borderColor);
    doc.line(marginLeft, currentY, 200 - marginRight, currentY);
    currentY += 5;

    doc.setFontSize(11);
    doc.setTextColor(textColor);

    // Información básica
    doc.text(`Vehículo: ${venta.vehiculoInfo}`, marginLeft, currentY);
    currentY += 6;

    doc.text(`Patente: ${venta.patenteVehiculo}`, marginLeft, currentY);
    currentY += 6;

    // Detalles adicionales si existen
    if (venta.vehiculoResumen) {
      if (venta.vehiculoResumen.año) {
        doc.text(`Año: ${venta.vehiculoResumen.año}`, marginLeft, currentY);
        currentY += 6;
      }
      if (venta.vehiculoResumen.motor) {
        doc.text(`Motor: ${venta.vehiculoResumen.motor}`, marginLeft, currentY);
        currentY += 6;
      }
      if (venta.vehiculoResumen.chasis) {
        doc.text(`Chasis: ${venta.vehiculoResumen.chasis}`, marginLeft, currentY);
        currentY += 6;
      }
    }

    currentY += 5;
  };

  // Sección Transacción
  const addTransaccionSection = () => {
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("DETALLES DE LA TRANSACCIÓN", marginLeft, currentY);
    currentY += 7;

    doc.setDrawColor(borderColor);
    doc.line(marginLeft, currentY, 200 - marginRight, currentY);
    currentY += 5;

    doc.setFontSize(11);
    doc.setTextColor(textColor);

    // Monto total
    doc.setFontSize(12);
    doc.setTextColor(accentColor);
    doc.text(
      `Monto total: $${Number(venta.monto).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      marginLeft,
      currentY
    );
    currentY += 8;

    // Métodos de pago
    if (venta.pagos?.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(textColor);
      doc.text("Métodos de pago:", marginLeft, currentY);
      currentY += 6;

      venta.pagos.forEach((pago) => {
        doc.text(
          `- ${pago.metodo || "N/A"}: $${Number(pago.monto).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}`,
          marginLeft + 5,
          currentY
        );
        currentY += 6;
      });
    }

    currentY += 5;
  };

  // Sección Vehículo Parte de Pago
  const addVehiculoPartePagoSection = () => {
    if (!venta.vehiculoPartePago) return;

    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("VEHÍCULO COMO PARTE DE PAGO", marginLeft, currentY);
    currentY += 7;

    doc.setDrawColor(borderColor);
    doc.line(marginLeft, currentY, 200 - marginRight, currentY);
    currentY += 5;

    doc.setFontSize(11);
    doc.setTextColor(textColor);

    // Información del vehículo
    doc.text(
      `Vehículo: ${venta.vehiculoPartePago.marca} ${venta.vehiculoPartePago.modelo} (${venta.vehiculoPartePago.patente})`,
      marginLeft,
      currentY
    );
    currentY += 6;

    if (venta.vehiculoPartePago.año) {
      doc.text(`Año: ${venta.vehiculoPartePago.año}`, marginLeft, currentY);
      currentY += 6;
    }

    doc.setTextColor(accentColor);
    doc.text(
      `Monto: $${Number(venta.vehiculoPartePago.monto).toLocaleString("es-AR")}`,
      marginLeft,
      currentY
    );
    currentY += 6;

    doc.setTextColor(textColor);
    if (venta.vehiculoPartePago.recibidoPor) {
      doc.text(`Recibido por: ${venta.vehiculoPartePago.recibidoPor}`, marginLeft, currentY);
      currentY += 6;
    }

    currentY += 5;
  };

  // Sección Firmas
  const addFirmasSection = () => {
    const firmaY = 250;
    
    // Línea de firma vendedor
    doc.setDrawColor(borderColor);
    doc.line(marginLeft + 20, firmaY, marginLeft + 80, firmaY);
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text("Vendedor", marginLeft + 50, firmaY + 8, { align: "center" });

    // Línea de firma cliente
    doc.line(marginLeft + 120, firmaY, marginLeft + 180, firmaY);
    doc.text("Cliente", marginLeft + 150, firmaY + 8, { align: "center" });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text("Documento generado automáticamente", 105, 290, { align: "center" });
    doc.text(new Date().toLocaleString(), 105, 293, { align: "center" });
  };

  // Generar el PDF
  addHeader();
  addClienteSection();
  addVehiculoSection();
  addTransaccionSection();
  addVehiculoPartePagoSection();
  addFirmasSection();

  // Guardar el PDF
  doc.save(`venta_${venta.id}_${dayjs().format('YYYYMMDD')}.pdf`);
}