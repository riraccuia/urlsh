const ROUTES = {
  CREATE: '/new',
  LIST: '/list',
  FLUSH: '/flush'
};

function generateShortCode(length) {
  const parsedLength = parseInt(length, 10);
  const codeLength = (parsedLength && parsedLength > 0) ? parsedLength : 4;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export { ROUTES, generateShortCode };

