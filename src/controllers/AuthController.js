const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
      }
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Chave JWT não configurada no servidor.' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
      }

      const token = jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Erro ao realizar login:', error);
      return res.status(500).json({ message: 'Erro ao realizar login.' });
    }
  }
}

module.exports = new AuthController();
