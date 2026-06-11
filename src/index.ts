import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Load environment variables
dotenv.config(); // updated 2026-06-09


// Import Routes
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import goldPriceRoutes from './routes/goldPrices';
import branchRoutes from './routes/branches';
import appointmentRoutes from './routes/appointments';
import customOrderRoutes from './routes/customOrders';
import favoriteRoutes from './routes/favorites';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import reviewRoutes from './routes/reviews';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API مجوهرات حمزة — Jewelry Hamza',
      version: '1.0.0',
      description: 'توثيق الـ API الخاص بتطبيق وموقع إدارة مجوهرات حمزة في طرابلس - ليبيا',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, './routes/*.ts'), path.join(__dirname, './routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/gold-prices', goldPriceRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/custom-orders', customOrderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);

// Base route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'مرحباً بك في API مجوهرات حمزة (Jewelry Hamza)',
    docs: '/api-docs',
    status: 'running',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  console.log(`Swagger API docs available at http://localhost:${PORT}/api-docs`);
});
