const moment = require('moment');

const convertDate = (fechaEmision) => {
    const fechaMoment = moment({
        year: fechaEmision.y,
        month: fechaEmision.m - 1,
        day: fechaEmision.d
    });
    return fechaMoment;
};
class AppError {
    constructor(code, message = false) {
        Error.call(this);
        Error.captureStackTrace(this);
        this.code = code;
        this.message = message;
    }
}
module.exports = {
    convertDate,
    AppError
}