
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: 'E-mail e senha são obrigatórios.',
        });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message: 'Chave JWT não configurada no servidor.',
        });
      }

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          message: 'E-mail ou senha inválidos.',
        });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: 'E-mail ou senha inválidos.',
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          isAdmin: user.isAdmin,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        }
      );

      return res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
        user: {
          id: user.id,
          firstname: user.firstname,
          surname: user.surname,
          email: user.email,
          isAdmin: user.isAdmin,
        },
      });

    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao realizar login.',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
