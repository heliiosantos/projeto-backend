const bcrypt = require('bcrypt');
const { User } = require('../models');
const { ValidationError, UniqueConstraintError } = require('sequelize');

class UserController {
  async create(req, res) {
    try {
      const { firstname, surname, email, password, confirmPassword } = req.body;

      if (!firstname || !surname || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Informe firstname, surname, email, password e confirmPassword.' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'A senha e a confirmação de senha não conferem.' });
      }

      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ firstname, surname, email, password: passwordHash });
      const userData = user.toJSON();
      delete userData.password;

      return res.status(201).json(userData);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: 'Dados de usuário inválidos.', details: error.errors?.map((item) => item.message) });
      }
      console.error('Erro ao cadastrar usuário:', error);
      return res.status(500).json({ message: 'Erro interno ao cadastrar usuário.' });
    }
  }

  async findAll(req, res) {
    try {
      const users = await User.findAll({ attributes: { exclude: ['password'] } });
      return res.status(200).json(users);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ message: 'Erro interno ao listar usuários.' });
    }
  }

  async findOne(req, res) {
    try {
      const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
      return res.status(200).json(user);
    } catch (error) {
      console.error('Erro ao consultar usuário:', error);
      return res.status(500).json({ message: 'Erro interno ao consultar usuário.' });
    }
  }

  async update(req, res) {
    try {
      const { firstname, surname, email } = req.body;
      if (firstname === undefined && surname === undefined && email === undefined) {
        return res.status(400).json({ message: 'Informe firstname, surname ou email para atualizar.' });
      }

      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      if (email !== undefined && email !== user.email) {
        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
      }

      if (firstname !== undefined) user.firstname = firstname;
      if (surname !== undefined) user.surname = surname;
      if (email !== undefined) user.email = email;

      await user.save();
      return res.status(204).send();
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: 'Dados de usuário inválidos.' });
      }
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ message: 'Erro interno ao atualizar usuário.' });
    }
  }

  async remove(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
      await user.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return res.status(500).json({ message: 'Erro interno ao excluir usuário.' });
    }
  }
}

module.exports = new UserController();
