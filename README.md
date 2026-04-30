<div align="center">
  <h1>🏗️ Database Architecture Lab</h1>
  <p>A comprehensive laboratory for exploring Database Architecture, System Design, and Backend Best Practices.</p>

  <p>
    <img src="https://img.shields.io/badge/Database-Architecture-blue?style=for-the-badge&logo=postgresql" alt="Database Architecture" />
    <img src="https://img.shields.io/badge/System-Design-success?style=for-the-badge&logo=serverless" alt="System Design" />
    <img src="https://img.shields.io/badge/Backend-Best%20Practices-orange?style=for-the-badge&logo=nodedotjs" alt="Backend Best Practices" />
  </p>
</div>

<br />

## 📖 About The Project

**Database Architecture Lab** is a hands-on repository designed to explore, test, and document various database concepts, architectural patterns, and system design principles. Whether you are looking to understand the intricacies of transaction isolation levels, solve the N+1 query problem, or design a scalable backend architecture, this repository serves as a practical guide and playground.

## 🗂️ Repository Structure

The repository is organized into several key directories, each focusing on a specific aspect of software engineering and database management:

- 📂 **`adr/` (Architecture Decision Records)**: Documents the architectural choices made, including repository layers, ORM boundaries, pagination strategies, and security basics.
- 📂 **`benchmarks/`**: In-depth markdown files explaining core concepts, performance benchmarks, and architectural patterns. Covers topics from indexing and caching to Domain-Driven Design (DDD) and Clean Architecture.
- 📂 **`sql/`**: A collection of SQL scripts for creating schemas, seeding data, and running queries to demonstrate concepts like N+1 problems, indexing performance, and transaction behaviors.
- 📂 **`boilerplate/`**: A starter Node.js/Express application structured with controllers, services, and repositories to quickly bootstrap new experiments.

## 🚀 Topics Covered

This lab covers a wide array of topics essential for modern backend development:

### 💾 Database Performance & Query Optimization
- Indexing Strategies (B-Tree, Composite Indexes)
- Identifying and fixing the **N+1 Problem**
- Pagination Strategies (Offset vs. Cursor-based)
- Query Analysis (`EXPLAIN ANALYZE`)

### 🔄 Transactions & Concurrency
- Transaction Boundaries and Architecture
- Isolation Levels & Read Anomalies (Dirty Read, Non-repeatable Read, Phantom Read)
- Locking Mechanisms (Optimistic vs. Pessimistic Locking)

### 🏛️ Architecture & System Design
- Clean Architecture & Layered Monoliths
- Domain-Driven Design (DDD)
- CQRS & Read Replicas
- Horizontal vs. Vertical Scaling
- High Availability & Load Balancing

### 🛠️ Backend Engineering
- Authentication & Authorization
- Caching Strategies & Invalidation
- Idempotency & Rate Limiting
- Logging, Monitoring & Observability
- Event-Driven Architecture & WebSockets
- Background Jobs (BullMQ)

## 💻 Getting Started

### Prerequisites
- PostgreSQL (for running SQL scripts)
- Node.js (for the boilerplate app)

### Exploring the SQL Lab
1. Navigate to the `sql/` directory.
2. Run the table creation scripts (e.g., `create_users_table.sql`, `create_order_and_product_table.sql`).
3. Seed the database using the provided seed files.
4. Execute the query scripts to observe performance differences (e.g., `q1_no_index.sql` vs `q4_with_index.sql`).

### Reading the Concepts
Dive into the `benchmarks/` folder to read detailed explanations of various system design and database topics. Each file is numbered for a progressive learning experience.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to explore the repository, run the experiments, and submit a Pull Request if you have a new architectural pattern or database experiment to share.
