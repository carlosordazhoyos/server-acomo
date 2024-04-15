const { default: axios } = require('axios');
const ViewClientsReport = require('../db/models/ViewClientsReport')
const XLSX = require('xlsx-js-style');
const Operation = require('../db/models/Operation');
const moment = require('moment');

function letrasIguales(texto) {
    texto = texto.toLowerCase();
    const primeraLetra = texto[0];
    for (let i = 1; i < texto.length; i++) {
        if (texto[i] !== primeraLetra) {
            return false;
        }
    }
    return true;
}

const validateUsers = async (req, res) => {
    try {
        const users = await ViewClientsReport.find({ level: '30' });
        let emailMap = new Map();
        let cellMap = new Map();
        for (const user of users) {
            if (!emailMap.has(user.email)) {
                emailMap.set(user.email, []);
            }
            if (!cellMap.has(user.cellphone)) {
                cellMap.set(user.cellphone, []);
            }
            emailMap.get(user.email).push(user);
            cellMap.get(user.cellphone).push(user);
        }

        let emailDup = [];
        let cellDup = [];

        emailMap.forEach(userList => {
            if (userList.length > 1) {
                for (const user of userList) {
                    emailDup.push(user);
                }
            }
        });

        cellMap.forEach(userList => {
            if (userList.length > 1) {
                for (const user of userList) {
                    cellDup.push(user);
                }
            }
        });

        let general = [];
        let tests = [];

        for (const user of users) {
            if (user.operations.length == 0 || !user.is_active || !user.confirmed_access) {
                general.push(user);
            }
            if (user.name.toLowerCase().includes('prueba') || letrasIguales(user.name) || letrasIguales(user.username) ||
                user.name.length <= 2 || user.lname_p.length <= 2 || user.lname_m.length <= 2 || letrasIguales(user.cellphone) || user.address.length <= 2) {

                tests.push(user);
            }
        }

        const mapper = (param) => {
            return param.map(user => ({
                status: `${user.operations.length == 0 ? '❌' : '✓'}${user.is_active ? '✓' : '❌'}${user.confirmed_access ? '✓' : '❌'}`,
                email: user.email,
                username: user.username,
                operations: user.operations.length,
                name: user.name,
                lname_p: user.lname_p,
                is_active: user.is_active,
                confirmed_access: user.confirmed_access,
                // company_name: user.company_name,
                cellphone: user.cellphone,
                level: user.level,
                lname_m: user.lname_m, job: user.job,
                address: user.address,
                created_at: user.created_at,
                district: user.district,
                province: user.province,
                department: user.department
            }));
        }

        emailDup = mapper(emailDup);
        cellDup = mapper(cellDup);
        general = mapper(general);
        tests = mapper(tests);

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(emailDup);
        const worksheet_1 = XLSX.utils.json_to_sheet(cellDup);
        const worksheet_2 = XLSX.utils.json_to_sheet(general);
        const worksheet_3 = XLSX.utils.json_to_sheet(tests);

        const applyStyle = (column, index) => {
            const cellRef = XLSX.utils.encode_cell({ c: column, r: index + 1 });
            if (!worksheet_3[cellRef]) worksheet_3[cellRef] = {};
            worksheet_3[cellRef].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" },
                },
            };
        }

        tests.forEach((user, index) => {
            if (letrasIguales(user.name) || user.name.toLowerCase().includes('prueba') || user.name.length <= 2) {
                applyStyle(4, index);
            }
            if (letrasIguales(user.username)) {
                applyStyle(2, index);
            }
            if (user.lname_p.length <= 2) {
                applyStyle(5, index);
            }
            if (letrasIguales(user.cellphone)) {
                applyStyle(8, index);
            }
            if (user.lname_m.length <= 2) {
                applyStyle(10, index);
            }
            if (user.address.length <= 2) {
                applyStyle(12, index);
            }
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, 'email');
        XLSX.utils.book_append_sheet(workbook, worksheet_1, 'cellphone');
        XLSX.utils.book_append_sheet(workbook, worksheet_2, 'general');
        XLSX.utils.book_append_sheet(workbook, worksheet_3, 'test');

        XLSX.writeFile(workbook, './file.xlsx');
        return res.status(200).json({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}


const validateUserByDni = async (req, res) => {
    try {
        let users = await ViewClientsReport.aggregate([
            {
                $match: {
                    level: '30'
                }
            }
        ]);
        let report = [];
        let celdas = [];
        let intentos = 0;
        const sinTilde = (texto) => {
            return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        const espera = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let index = 0; index < users.length; index++) {
            let user = users[index];
            if (user.username.length == 8) {
                try {
                    const response = await axios.post('https://api.migo.pe/api/v1/dni', {
                        token: '8esC32roDlDbSEYDTii0A2h3cv4mZeHEsdi2zwUvSHeZOaqNOVgKNqfu2MSU',
                        dni: user.username
                    });
                    const fname = response.data.nombre;
                    const lname_p = sinTilde(fname.split(' ')[0]);
                    const lname_m = sinTilde(fname.split(' ')[1]);
                    let name = sinTilde(fname.split(' ')[2]);
                    if (fname.split(' ')[3]) {
                        name += ` ${sinTilde(fname.split(' ')[3])}`
                    }
                    if (fname.split(' ')[4]) {
                        name += ` ${sinTilde(fname.split(' ')[4])}`
                    }
                    const u_name = sinTilde(user.name.trim().toUpperCase());
                    const u_lname_p = sinTilde(user.lname_p.toUpperCase().trim());
                    const u_lname_m = sinTilde(user.lname_m.toUpperCase().trim());
                    if (u_name != name || u_lname_p != lname_p || u_lname_m != lname_m) {
                        report.push({ ...user, correct: fname, status: '✓' });
                        if (u_name != name) {
                            const cellRef = XLSX.utils.encode_cell({ c: 1, r: report.length });
                            celdas.push(cellRef);
                        }
                        if (u_lname_p != lname_p) {
                            const cellRef = XLSX.utils.encode_cell({ c: 2, r: report.length });
                            celdas.push(cellRef);
                        }
                        if (u_lname_m != lname_m) {
                            const cellRef = XLSX.utils.encode_cell({ c: 3, r: report.length });
                            celdas.push(cellRef);
                        }
                        console.log(index);
                    }
                } catch (error) {
                    intentos++;
                    if (intentos > 3) {
                        console.log('Esperando..');
                        await espera(1000 * 60 * 2);
                        intentos = 0;
                        index -= 5;
                    }
                    report.push({ ...user, correct: '', status: '❌' });
                    console.log(index);
                }
            }
        }

        report = report.map(user => ({
            username: user.username,
            name: user.name,
            lname_p: user.lname_p,
            lname_m: user.lname_m,
            correct: user.correct,
            level: user.level,
            //company_name: user.company_name,
            email: user.email,
            cellphone: user.cellphone,
            operations: user.operations.length,
            created_at: user.created_at,
            status: user.status
        }))

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(report);

        for (const celda of celdas) {
            if (!worksheet[celda]) worksheet[celda] = {};
            worksheet[celda].s = {
                fill: {
                    fgColor: { rgb: "C5D9F1" },
                },
            };
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'file_2');
        XLSX.writeFile(workbook, './file_2.xlsx');
        console.log('fin');
        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

const consultaDni = async (req, res) => {
    try {
        const pathFile = './consulta_dni.xlsx';
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

        dataSheet = dataSheet.filter(data => data.status != '✓');
        let idx = 0;
        let report = [];
        let celdas = [];
        const sinTilde = (texto) => {
            return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        for (const user of dataSheet) {
            try {
                const response = await axios.post('https://api.migo.pe/api/v1/dni', {
                    token: '8esC32roDlDbSEYDTii0A2h3cv4mZeHEsdi2zwUvSHeZOaqNOVgKNqfu2MSU',
                    dni: user.username
                });
                const fname = response.data.nombre;
                const lname_p = sinTilde(fname.split(' ')[0]);
                const lname_m = sinTilde(fname.split(' ')[1]);
                let name = sinTilde(fname.split(' ')[2]);
                if (fname.split(' ')[3]) {
                    name += ` ${sinTilde(fname.split(' ')[3])}`
                }
                if (fname.split(' ')[4]) {
                    name += ` ${sinTilde(fname.split(' ')[4])}`
                }
                const u_name = sinTilde(user.name.trim().toUpperCase());
                const u_lname_p = sinTilde(user.lname_p.toUpperCase().trim());
                const u_lname_m = sinTilde(user.lname_m.toUpperCase().trim());
                if (u_name != name || u_lname_p != lname_p || u_lname_m != lname_m) {
                    report.push({ ...user, correct: fname, status: '✓' });
                    if (u_name != name) {
                        const cellRef = XLSX.utils.encode_cell({ c: 1, r: report.length });
                        celdas.push(cellRef);
                    }
                    if (u_lname_p != lname_p) {
                        const cellRef = XLSX.utils.encode_cell({ c: 2, r: report.length });
                        celdas.push(cellRef);
                    }
                    if (u_lname_m != lname_m) {
                        const cellRef = XLSX.utils.encode_cell({ c: 3, r: report.length });
                        celdas.push(cellRef);
                    }
                }
            } catch (error) {
                report.push({ ...user, correct: '', status: '❌' });
            }
            console.log(idx);
            idx++;
        }
        const _workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(report);
        for (const celda of celdas) {
            if (!worksheet[celda]) worksheet[celda] = {};
            worksheet[celda].s = {
                fill: {
                    fgColor: { rgb: "C5D9F1" },
                },
            };
        }
        XLSX.utils.book_append_sheet(_workbook, worksheet, 'file_2');
        XLSX.writeFile(_workbook, './file_name.xlsx');
        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

const fixReporByDni = async (req, res) => {
    try {
        const pathFile = './consulta_dni.xlsx';
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        const users = await ViewClientsReport.aggregate([{ $match: { level: '30' } }]);
        const userMap = new Map(users.map(user => [user.username, user]));
        let report = [];
        for (const data of dataSheet) {
            const user = userMap.get(data.username);
            report.push({ ...data, document_type: user ? user.document_type : '', created_at: user.created_at });
        }

        const _workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(report);
        XLSX.utils.book_append_sheet(_workbook, worksheet, `Report`);
        XLSX.writeFile(_workbook, './report.xlsx');
        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}


const fixUserNames = async (req, res) => {
    try {
        const pathFile = './consulta_dni.xlsx';
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        const dataMap = new Map(dataSheet.map(data => [data.username, data]));
        const users = await ViewClientsReport.aggregate([{ $match: { level: '30' } }]);

    } catch (error) {

        
    }
}

const exportOperations = async (req, res) => {
    try {
        const operations = await Operation.aggregate([

        ])
        const _workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(report);
        XLSX.utils.book_append_sheet(_workbook, worksheet, `Report`);
        XLSX.writeFile(_workbook, './report.xlsx');
        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
module.exports = {
    validateUsers,
    validateUserByDni,
    consultaDni,
    fixReporByDni,
    fixUserNames
}

//token: '8esC32roDlDbSEYDTii0A2h3cv4mZeHEsdi2zwUvSHeZOaqNOVgKNqfu2MSU',

