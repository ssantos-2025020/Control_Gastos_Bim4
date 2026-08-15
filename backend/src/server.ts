import app from './app';

const PORT = process.env.PORT ?? 3100;

app.listen(PORT, () => {
  console.log(`[Server] Login Control de Gastos API escuchando en http://localhost:${PORT}`);
});