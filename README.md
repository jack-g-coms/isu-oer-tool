# ISU OER Tool Dev
An AI-powered platform for generating and editing open educational resources from instructor-provided course materials.

The platform allows users to upload documents such as PDFs, PowerPoint presentations, and Word documents, then uses retrieval-augmented generation (RAG) to create structured textbook content grounded in those source materials.

## Overview

The goal of this project is to make it easier for instructors to turn existing course materials into organized, editable educational content.

Users can:

- Upload course documents
- Extract and process document content
- Generate textbook outlines using AI
- Generate individual textbook sections using relevant source material
- Edit generated content through a web interface
- Export completed textbooks to PDF

Rather than sending entire documents to an LLM for every request, the platform processes uploaded content into smaller chunks and retrieves the most relevant information for each generated section.

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Material UI
- TipTap

### Backend

- Next.js API routes
- Prisma
- PostgreSQL
- pgvector

### AI / Retrieval

- OpenAI API
- Vector embeddings
- Retrieval-Augmented Generation (RAG)

### Background Processing

- Redis
- BullMQ
- Dockerized worker processes

### Storage and Export

- S3-compatible object storage
- MinIO for local development
- Puppeteer for PDF generation

## How It Works

### 1. Document Ingestion

Uploaded documents are parsed and converted into text. The extracted content is divided into overlapping chunks that can be independently searched and retrieved.

### 2. Embeddings

Each chunk is converted into a vector embedding and stored in PostgreSQL using `pgvector`.

### 3. Outline Generation

The system uses the uploaded course material to generate a structured textbook outline containing chapters and sections.

### 4. Section Retrieval

When generating a textbook section, the system searches the vector database for the document chunks most relevant to that section.

### 5. AI Generation

The retrieved source material is supplied to the language model as context so that generated textbook content is grounded in the instructor's uploaded material.

### 6. Background Jobs

Long-running operations such as document processing and textbook generation are handled asynchronously using BullMQ workers and Redis rather than blocking web requests.

### 7. Editing and Export

Generated textbook content can be reviewed and edited in the browser before being exported as a PDF.

## Screenshots
<img width="1921" height="922" alt="image" src="https://github.com/user-attachments/assets/ec573e57-2338-46a8-b9cb-3f8eabe17b43" />
<img width="1923" height="920" alt="image" src="https://github.com/user-attachments/assets/5992378d-c445-4986-a568-af9d49e66d35" />

