# App-ST Frontend

This is the frontend application for the App-ST internal management system, built with Vue.js 3, Vite, and Vuetify 3. It provides a user interface for managing various aspects of the business, including inventory, BOM checking, project tracking, and user administration.

## Features

- **Authentication:** Secure user login and logout using JWT.
- **Role-Based Access Control:** Different features and views are accessible based on user roles (Admin, Kế hoạch, Thủ kho, Kinh doanh, Quản lý).
- **Warehouse Management (Tồn Kho / Tồn Kho 2):**
  - View inventory list with search and pagination.
  - Add new inventory items manually.
  - Edit existing inventory items (including automatic inventory calculation based on input/output).
  - Delete inventory items.
  - Import inventory data from Excel files.
  - Export current inventory data to an Excel file.
  - Fetch and display component details (datasheet, parameters, image) from the Digi-Key API.
- **BOM Checking (Kiểm tra số liệu):**
  - Upload Bill of Materials (BOM) files along with project details (PO, Quantity).
  - Process BOMs against current warehouse inventory to check availability.
  - View processed BOM results.
  - Download processed BOM data as an Excel file.
  - Save processed BOM data as an "Order" for tracking.
  - Edit/Delete previously uploaded BOM definitions.
- **Order Tracking (Tình trạng đơn hàng):**
  - View a list of saved orders generated from BOM checks.
  - Check the status of orders (Pending/Confirmed by warehouse).
  - View order details.
  - Delete orders.
- **Project Management (Dự án):**
  - View a list of customers/projects.
  - Add/Edit/Delete customers.
  - Import project data (likely customer/PO structure) from Excel.
  - View detailed Purchase Orders (POs) for each customer.
  - Add/Edit/Delete items within a specific PO (tracking delivered vs. remaining quantities).
  - Download specific PO details as an Excel file.
- **Settings (Cài đặt - Admin Only):**
  - View list of application users.
  - Add new users with specific roles.
  - Edit existing user details and roles.
  - Delete users.
  - Bulk delete data for specific modules (Warehouse, Warehouse 2, BOMs, Projects).

## Tech Stack

- **Frontend:**
  - Vue.js 3 (Composition API)
  - Vite
  - Vuetify 3
  - Vue Router 4
  - Axios (for API requests)
  - jwt-decode (for decoding JWT tokens)
- **Backend:** This repository only contains the frontend code. It requires a separate backend API to function, which handles data storage, business logic, authentication, and interactions with external services like Digi-Key.

## Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd App-ST/frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `frontend` directory root. Copy the contents of `.env.example` (if available) or add the following variables:

    ```env
    # URL of the backend API server
    VITE_API_URL=http://localhost:3000 # Replace with your actual backend URL

    # Digi-Key API Credentials (for component lookup feature)
    VITE_DIGIKEY_CLIENT_ID=YOUR_DIGIKEY_CLIENT_ID
    VITE_DIGIKEY_CLIENT_SECRET=YOUR_DIGIKEY_CLIENT_SECRET
    ```

    - Replace `http://localhost:3000` with the actual URL where your backend API is running.
    - Obtain API credentials from the Digi-Key API Portal if you need the component lookup feature.

## Running the Application

1.  **Start the development server:**
    ```bash
    npm install axios body-parser buffer cors dotenv express fs mine-types multer puppeteer socket.io-client socket.io sqlite3 xlsx bcrypt
    npm run dev
    # or
    yarn dev
    ```

2.  Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Building for Production

1.  **Build the application:**
    install package
    npm install axios body-parser buffer cors dotenv express fs mine-types multer puppeteer socket.io-client socket.io sqlite3 xlsx
    `bash
    npm run build
    # or
    yarn build
    `

2.  This will create a `dist` folder containing the optimized static assets. Deploy the contents of this folder to your web server or hosting platform.

## Project Structure
