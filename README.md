# FH Room Checker

**[FH Room Checker](https://fh-room-checker.vercel.app/)** is a full-stack room availability application built for FH JOANNEUM. It solves a common campus frustration: arriving at a room to find it occupied. By reverse-engineering internal timetable data, this app provides a real-time view of which rooms are free now, which will be free soon, and detailed schedules for every room.

![Status](https://img.shields.io/badge/Status-Active_Development-success)
![Frontend](https://img.shields.io/badge/Frontend-Angular_18%2B_%7C_Ionic_8-blue)
![Backend](https://img.shields.io/badge/Backend-Laravel_12_%7C_PHP_8.2-red)
![Mobile](https://img.shields.io/badge/Mobile-Capacitor_7-green)

---

## 🚀 Key Features

*   **Real-Time Availability**: Instantly see which rooms are "Free Now" and for how long.
*   **Smart "Free Time" Logic**: Unlike standard timetables that show *occupied* times, this app calculates and displays *free* time slots.
*   **Building & Room Filtering**: Browse calendars and availability for specific buildings (e.g., AP152, EA11 in Graz; ES30i in Kapfenberg).
*   **Full Schedule View**: Detailed day-by-day timeline for every room.
*   **Mobile Optimized**: Built with Ionic and Capacitor for a native-like experience on iOS and Android.

## 🏗️ Architecture & Tech Stack

The project has evolved from a prototype into a robust full-stack solution.

### Frontend (`/frontend`)
*   **Framework**: [Angular](https://angular.io/) (v18+) & [Ionic](https://ionicframework.com/) (v8)
*   **Mobile Runtime**: [Capacitor](https://capacitorjs.com/) (v7) for iOS/Android builds.
*   **Styling**: SCSS with Ionic components.
*   **State**: RxJS for reactive state management.

### Backend (`/backend`)
*   **Framework**: [Laravel](https://laravel.com/) (v12).
*   **Language**: PHP 8.2+.
*   **Database**: SQLite (default)/MySQL.
*   **API**: RESTful API to serve room and building data.
*   **Logic**: Custom algorithms to parse FH schedule raw data into "availability" blocks.

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18+) & npm
*   PHP 8.2+ & Composer
*   Ionic CLI (`npm install -g @ionic/cli`)

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install PHP dependencies:
    ```bash
    composer install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
4.  Run migrations:
    ```bash
    php artisan migrate
    ```
5.  Start the development server:
    ```bash
    php artisan serve
    ```
    The API will be available at `http://localhost:8000`.

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install Node dependencies:
    ```bash
    npm install
    ```
3.  Configure environment:
    *   Check `src/environments/environment.ts` and ensure `apiBaseUrl` points to your backend (default logic may vary).
4.  Start the development server:
    ```bash
    npm run start
    # or
    ionic serve
    ```
    The app will run at `http://localhost:8100` (or `4200`).

---

## � Project Structure

### Frontend (`/frontend/src/app`)

The frontend is built with **Angular** and **Ionic**, organized by feature modules.

```
src/app/
├── home/                # Main dashboard view
├── pages/               # Feature-specific pages
│   ├── onboarding/      # First-time user setup (Building selection)
│   ├── building-overview/ # List of floors and rooms for a building
│   └── room-schedule/   # Detailed timeline for a specific room
├── services/            # Business logic and API communication
│   ├── api.service.ts   # Main service for backend calls
│   └── storage.service.ts # Local storage management
```

### Backend (`/backend/app`)

The backend is a **Laravel** application that processes and serves data.

```
app/
├── Http/Controllers/    # API Controllers (handle requests)
│   ├── BuildingController.php # Manages building data
│   └── RoomController.php     # Handles room availability logic
├── Models/              # Database Models (Eloquent ORM)
│   ├── Building.php     # Represents a university building
│   ├── Room.php         # Represents a physical room
│   └── Schedule.php     # Stores parsed class events
├── Services/            # Core business logic
│   └── ScraperService.php # (Internal) Logic to parse raw timetable data
```

---

## �📱 Mobile Build

To build the app for mobile devices using Capacitor:

```bash
cd frontend
npm run build
npx cap sync
npx cap open ios      # For iOS (requires Xcode)
npx cap open android  # For Android (requires Android Studio)
```

## 🔌 API Documentation

Key endpoints defined in `routes/api.php`:

*   `POST /buildings/initialize`: Initialize building data.
*   `GET /rooms/{building}/now`: Get a list of rooms currently free in a specific building.
*   `GET /rooms/{building}/schedule`: Get the full schedule for a building's rooms.

## 👥 Authors

*   **Seymur Mammadov**
*   **Jakob Schnurrer**

## 📄 License

[License](LICENSE)
