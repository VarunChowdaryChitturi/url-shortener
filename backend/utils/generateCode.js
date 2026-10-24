const chars =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const generateCode = (len = 6) => {
  let code = "";

  for (let i = 0; i < len; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }

  return code;
};

module.exports = generateCode;