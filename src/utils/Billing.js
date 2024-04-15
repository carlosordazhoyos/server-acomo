const { CONFIG } = require("../config");
const Credential = require('../db/models/Credential');

const sendBill = async (bill) => {
    await validateToken();
    const [credential] = await Credential.find({ key: CONFIG.SLIN_KEY });

    return axios.post(`${CONFIG.SLIN_API}/input/InsertJson`, bill, {
        headers: {
            "content-Type": "application/json",
            Authorization: `Bearer ${credential.token}`,
        },
    });
};

const generateNote = (noteData) => {
    const note = generateBill(noteData);
    note.tipo_de_documento_afectado = noteData.affected_doc_type;
    note.serie_y_numero_de_documento_afectado = noteData.voucher_serie;
    note.codigo_de_tipo_de_la_nota = noteData.note_type;
    note.motivo_o_sustento_de_la_nota = noteData.note_description;
    return note;
};

const generateBill = (billData) => {
    const bill = {
        version_del_ubl: "v21",
        serie_y_numero_correlativo: billData.serie,
        fecha_de_emision: billData.emitDate, // Fecha de Emision
        hora_de_emision: billData.emitTime, // Hora de emision
        tipo_de_documento: billData.doc_factura,
        tipo_de_moneda: billData.currency,
        fecha_de_vencimiento: null,
        datos_del_emisor: {
            numero_de_documento: "20604536261",
            codigo_del_domicilio_fiscal: "0000",
            direccion_domicilio_fiscal: "AV. EL DERBY 254 PISO 25 OFICINA 01",
            ubigeo_domicilio_fiscal: "150140",
            departamento_domicilio_fiscal: "LIMA",
            provincia_domicilio_fiscal: "LIMA",
            distrito_domicilio_fiscal: "SANTIAGO DE SURCO",
        },
        datos_del_cliente_o_receptor: {
            numero_de_documento: billData.customer_number,
            tipo_de_documento: billData.customer_doc_type,
            apellidos_y_nombres_o_razon_social: billData.customer_name,
        },
        totales: {},
        items: [],
        informacion_adicional: {
            tipo_de_operacion: "0101",
            leyendas: [],
        },
    };

    bill.items.push({
        codigo_interno_del_producto: billData.code,
        descripcion_detallada: billData.description,
        unidad_de_medida: "NIU",
        cantidad_de_unidades: `${parseFloat(billData.amount).toFixed(2)}`,
        valor_unitario: `${billData.change}`,
        codigo_de_tipo_de_precio: "01",
        precio_de_venta_unitario_valor_referencial: `${billData.change}`,
        afectacion_al_igv: "20",
        porcentaje_de_igv: "0",
        monto_de_igv: "0",
        valor_de_venta_por_item: `${parseFloat(
            billData.amount * billData.change
        ).toFixed(2)}`,
        total_por_item: `${parseFloat(billData.amount * billData.change).toFixed(
            2
        )}`,
    });

    bill.totales = {
        total_operaciones_gravadas: "0",
        total_operaciones_exoneradas: `${parseFloat(
            billData.amount * billData.change
        ).toFixed(2)}`,
        total_operaciones_inafectas: "0",
        total_operaciones_gratuitas: "0",
        sumatoria_igv: "0",
        sumatoria_isc: "0",
        total_de_la_venta: `${parseFloat(billData.amount * billData.change).toFixed(
            2
        )}`,
        total_descuento_global: "0",
        porcentaje_descuento_global: "0",
    };

    bill.extras = {};
    bill.extras.forma_de_pago = "Transferencia";
    bill.extras.formato_pdf = "ticket";

    if (billData.customerAddress)
        bill.extras.direccion = billData.customerAddress;

    return bill;
};

module.exports = {
    sendBill,
    generateBill,
    generateNote
}