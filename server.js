const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
require('dotenv').config();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servindo arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas para servir arquivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Conecte-se ao MongoDB Atlas
const uri = process.env.DB_MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Conectado ao MongoDB Atlas");
})
.catch((err) => {
  console.error("Erro ao conectar-se ao MongoDB Atlas:", err);
});

// Esquema e modelo de usuário
const userSchema = new mongoose.Schema({
  Nome_completo: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Usuario: { type: String, required: true, unique: true },
  Senha: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Rotas de API

// Registro
app.post('/api/register', async (req, res) => {
  const { Nome_completo, Email, Usuario, Senha } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(Senha, 10);
    const existingUser = await User.findOne({ Email });
    if (existingUser) {
      return res.status(400).send('Este e-mail já está registado');
    }
    const newUser = new User({
      Nome_completo,
      Email,
      Usuario,
      Senha: hashedPassword
    });
    await newUser.save();
    res.status(201).send('Usuário cadastrado com sucesso');
  } catch (err) {
    res.status(400).send('Erro ao registrar usuário');
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { Email, Senha } = req.body;
  try {
    const user = await User.findOne({ Email });
    if (!user) {
      return res.status(400).send('Usuário não encontrado');
    }
    const isMatch = await bcrypt.compare(Senha, user.Senha);
    if (!isMatch) {
      return res.status(400).send('Senha incorreta');
    }
    const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).send('Erro ao fazer login');
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
