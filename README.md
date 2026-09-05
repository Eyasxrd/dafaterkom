# ☕ Dafaterkom - Point of Sale & Retail Management System

Domain: [Dafaterkom.com](https://dafaterkom.com)

A comprehensive multi-tenant POS and restaurant management system with offline-first synchronization, inventory tracking, staff control, and customer loyalty.

## Features

### 🛒 Point of Sale
- Intuitive order interface with menu categories
- Add items to cart with quantity management
- Multiple payment methods (Cash, Card, Mobile)
- Table assignment for dine-in customers
- Customer information tracking
- Order notes and special requests

### 📦 Inventory Management
- Real-time stock tracking
- Low stock alerts and thresholds
- Quick quantity adjustments (+/-)
- Unit tracking (pieces, kg, liters, dozens)
- Last restocked timestamps
- Category-based organization

### 👥 Staff Management
- Employee profiles with roles (Admin, Manager, Cashier, Kitchen)
- Staff activation/deactivation
- Secure password management
- Role-based access control
- Staff performance tracking

### 📋 Order Management
- Real-time order status tracking
- Kitchen display system integration
- Order workflow (Pending → Preparing → Ready → Completed)
- Order cancellation support
- Payment status tracking
- Detailed order history

### 📊 Reports & Analytics
- Revenue tracking (Today, Week, Month, All Time)
- Popular items analysis
- Payment method breakdown
- Staff performance metrics
- Order status distribution
- Visual progress indicators

### 🎨 Responsive Design
- Desktop sidebar navigation
- Mobile bottom navigation
- Touch-friendly interface
- Optimized for both phones and PCs

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Prisma ORM
- **Authentication**: bcryptjs for password hashing
- **State Management**: Zustand
- **UI Components**: Custom components with Tailwind

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
npm run seed
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Data

The seed script creates:

### Categories
- Beverages
- Food  
- Desserts

### Menu Items
- House Coffee ($3.50)
- Caffe Latte ($4.50)
- Cappuccino ($4.25)
- Green Tea ($3.00)
- Club Sandwich ($8.50)
- Butter Croissant ($3.25)
- Chocolate Cake ($5.50)
- New York Cheesecake ($6.00)

### Staff Members (Password: password123)
- Admin User (admin@cafe.com) - Admin
- Sarah Manager (sarah@cafe.com) - Manager
- John Cashier (john@cafe.com) - Cashier
- Emily Cashier (emily@cafe.com) - Cashier
- Mike Kitchen (mike@cafe.com) - Kitchen

## Database Schema

### Core Models
- **Staff**: Employee management with roles and authentication
- **Category**: Menu item categorization
- **MenuItem**: Products with pricing and availability
- **Inventory**: Stock tracking with low stock alerts
- **Order**: Sales transactions with metadata
- **OrderItem**: Individual items in orders
- **Shift**: Staff shift tracking
- **Customer**: Customer profiles with loyalty points

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create inventory item
- `PATCH /api/inventory/[id]` - Update inventory
- `DELETE /api/inventory/[id]` - Delete inventory

### Staff
- `GET /api/staff` - Get all staff members
- `POST /api/staff` - Create staff member
- `PATCH /api/staff/[id]` - Update staff status
- `DELETE /api/staff/[id]` - Delete staff member

### Menu Items
- `GET /api/menu-items` - Get all menu items
- `POST /api/menu-items` - Create menu item

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order (with auto inventory deduction)
- `PATCH /api/orders/[id]` - Update order status

## Key Features

### Automatic Inventory Deduction
When an order is placed, the system automatically deducts the ordered quantities from inventory. This happens in real-time during the order creation process.

### Low Stock Alerts
Inventory items display visual alerts when quantity falls below the configured threshold, helping staff reorder before running out.

### Multi-Device Support
The responsive design ensures the system works seamlessly on:
- Desktop computers with sidebar navigation
- Tablets and phones with bottom navigation
- Touch-optimized buttons and interactions

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

### Database Management
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma db push` - Push schema changes to database
- `npx prisma generate` - Generate Prisma Client

## Future Enhancements

Potential features for future versions:
- Kitchen display system integration
- Customer loyalty program
- Employee scheduling
- Digital receipts (email/print)
- Promotions and discounts
- Multi-location support
- Advanced reporting with export
- Barcode scanning
- Integrated payment processing

## License

This project is private and proprietary.

## Support

For support and questions, visit [Dafaterkom.com](https://dafaterkom.com) or contact `support@dafaterkom.com`.
