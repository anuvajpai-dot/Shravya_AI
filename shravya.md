# Shravya AI Lite 🌐💬

**A lightweight cloud-hosted chat web app powered by a small Qwen model for older laptops**

---

## Overview

Shravya AI Lite is designed for **simple chat-first usage** with a **lightweight Qwen model** that can run even from an older laptop setup such as:

* **Intel i3 CPU**
* **8 GB RAM**
* no dedicated GPU required

The primary goal is to keep local development light while **deploying the final app on cloud like a normal web application**.

---

## Goals

* simple **chat box UI**
* lightweight backend
* optimized for **Qwen Lite / 1.5B model**
* deployable as **cloud web app**
* low memory footprint
* fast startup

---

## Recommended model for old laptop

For your i3 + 8 GB RAM system, use:

### Recommended

```bash
ollama run qwen2.5:1.5b
```

### Alternative

```bash
ollama run qwen2.5:0.5b
```

These models are much better suited than 7B/14B for older hardware.

Expected performance:

* 0.5B → very fast
* 1.5B → good balance
* 3B → possible but slower

---

## Lite system prompt (optimized)

Use this optimized prompt for smaller Qwen models.

```text
You are Shravya AI Lite, a helpful lightweight assistant.

Rules:
- give short and clear answers
- prioritize coding help and simple automation
- help draft emails and documentation
- keep responses concise to save tokens
- ask follow-up questions only when necessary
- use professional engineering language
- summarize long outputs in bullet points
```

### Why this prompt is modified

Smaller models perform better with:

* shorter instructions
* clear task boundaries
* less complex system context

This improves quality on older laptops.

---

## Architecture

```text
Frontend (React Chat UI)
        |
        v
FastAPI Backend
        |
        v
Qwen 1.5B via Ollama
        |
        v
Cloud Deployment (Render / Railway / Azure)
```

---

## Simple UI layout

```text
+--------------------------------+
|         Shravya AI Lite         |
+--------------------------------+
|                                |
|   Chat messages area           |
|                                |
|                                |
+--------------------------------+
|  Type message...     [Send]    |
+--------------------------------+
```

---

## Tech stack

### Frontend

* React
* Tailwind CSS

### Backend

* FastAPI
* Python

### Model

* Qwen 1.5B
* Ollama

### Hosting

Recommended cloud platforms:

* **Render**
* **Railway**
* **Azure App Service**
* **Vercel (frontend)**

---

## Deployment plan

### Frontend

Deploy React app on Vercel.

### Backend

Deploy FastAPI on Render or Railway.

### Model hosting options

### Option 1 — local inference

Use old laptop only for development.

### Option 2 — cloud VM

Deploy model on small cloud instance:

* 4 vCPU
* 8 GB RAM

Best for production.

---

## Learning steps

### Step 1

Run lightweight model locally.

### Step 2

Build simple FastAPI `/chat` endpoint.

### Step 3

Connect React chat box.

### Step 4

Deploy frontend and backend.

### Step 5

Add authentication and history.

---

## Future scope

* code helper mode
* email drafting
* markdown export
* PPT generation
* documentation assistant

---

Built with ❤️ as a lightweight AI web assistant.

