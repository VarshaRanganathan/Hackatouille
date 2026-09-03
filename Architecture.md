# System Architecture

```text
                               +-----------------------------+
                               |     User / Client Device    |
                               |    (React / Vite Web App)   |
                               +--------------+--------------+
                                              |
                                              | HTTPS / JSON
                                              v
                               +-----------------------------+
                               |     Express API Gateway     |
                               |       (Node.js Server)      |
                               +--------------+--------------+
                                              |
          +-----------------------------------+-----------------------------------+
          |                                   |                                   |
          v                                   v                                   v
+-------------------+               +-------------------+               +-------------------+
|   Savings Engine  |               |  Resilience Score |               | Responsible Credit|
|     Subsystem     |               |     Subsystem     |               |     Subsystem     |
|                   |               |                   |               |                   |
| • Safe-to-Save    |               | • Buffer Days     |               | • Affordability   |
|   calculation     |               | • 14-day Forecast |               |   Ceiling         |
| • Auto-skip logic |               | • Volatility      |               | • Debt Stress     |
| • Lumpy bill sweep|               |   tracking        |               |   Circuit Breaker |
+---------+---------+               +---------+---------+               +---------+---------+
          |                                   |                                   |
          +-----------------------------------+-----------------------------------+
                                              |
                                              | Supabase SDK
                                              v
                               +-----------------------------+
                               |      Supabase Backend       |
                               |   (PostgreSQL Database)     |
                               +-----------------------------+
                               | • Built-in Auth & JWT       |
                               | • Row Level Security (RLS)  |
                               | • Core Financial Tables     |
                               +-----------------------------+
