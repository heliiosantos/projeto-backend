
const bcrypt = require('bcrypt');
const { User } = require('../models');

class UserController {
  // Cadastrar usuário
  async create(req, res) {
    try {
      const { firstname, surname, email, password } = req.body;

      if (!firstname || !surname || !email || !password) {
        return res.status(400).json({
          message: 'Todos os campos são obrigatórios.',
        });
      }

      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(409).json({
          message: 'Este e-mail já está cadastrado.',
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await User.create({
        firstname,
        surname,
        email,
        password: passwordHash,
      });

      const userData = user.toJSON();
      delete userData.password;

      return res.status(201).json(userData);

    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);

      return res.status(500).json({
        message: 'Erro interno ao cadastrar usuário.',
      });
    }
  }

  // Listar todos os usuários
  async findAll(req, res) {
    try {
      const users = await User.findAll({
        attributes: {
          exclude: ['password'],
        },
      });

      return res.status(200).json(users);

    } catch (error) {
      console.error('Erro ao listar usuários:', error);

      return res.status(500).json({
        message: 'Erro interno ao listar usuários.',
      });
    }
  }

  // Consultar usuário por ID
  async findOne(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: {
          exclude: ['password'],
        },
      });

      if (!user) {
        return res.status(404).json({
          message: 'Usuário não encontrado.',
        });
      }

      return res.status(200).json(user);

    } catch (error) {
      console.error('Erro ao consultar usuário:', error);

      return res.status(500).json({
        message: 'Erro interno ao consultar usuário.',
      });
    }
  }

  // Atualizar usuário
  async update(req, res) {
    try {
      const { id } = req.params;
      const { firstname, surname, email, password } = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          message: 'Usuário não encontrado.',
        });
      }

      if (!firstname && !surname && !email && !password) {
        return res.status(400).json({
          message: 'Informe pelo menos um campo para atualizar.',
        });
      }

      if (email && email !== user.email) {
        const emailExists = await User.findOne({
          where: { email },
        });

        if (emailExists) {
          return res.status(409).json({
            message: 'Este e-mail já está cadastrado.',
          });
        }
      }

      if (firstname) user.firstname = firstname;
      if (surname) user.surname = surname;
      if (email) user.email = email;

      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }

      await user.save();

      const userData = user.toJSON();
      delete userData.password;

      return res.status(200).json(userData);

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);

      return res.status(500).json({
        message: 'Erro interno ao atualizar usuário.',
      });
    }
  }

  // Excluir usuário
  async remove(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          message: 'Usuário não encontrado.',
        });
      }

      await user.destroy();

      return res.status(200).json({
        message: 'Usuário excluído com sucesso.',
      });

    } catch (error) {
      console.error('Erro ao excluir usuário:', error);

      return res.status(500).json({
        message: 'Erro interno ao excluir usuário.',
      });
    }
  }
}

module.exports = new UserController();
