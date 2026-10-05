module.exports = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
