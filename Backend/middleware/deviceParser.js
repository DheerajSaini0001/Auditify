import { UAParser } from 'ua-parser-js';

const deviceParser = (req, res, next) => {
  const ua = req.headers['user-agent'];
  const parser = new UAParser(ua);
  const result = parser.getResult();

  req.deviceInfo = {
    device: result.device.type || 'Desktop',
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0'
  };

  next();
};

export default deviceParser;
