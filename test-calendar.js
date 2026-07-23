import handler from './api/calendar.js';
import dotenv from 'dotenv';
dotenv.config();

const req = { method: 'GET' };
const res = {
  status: (code) => ({
    json: (data) => console.log('STATUS:', code, 'JSON:', data),
    send: (data) => console.log('STATUS:', code, 'SEND:\n', data)
  }),
  setHeader: (k, v) => console.log('HEADER:', k, v)
};

handler(req, res).catch(console.error);
