import jwt from 'jsonwebtoken';
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
