# FIR-Sahayak 🚨
### A Multilingual, Voice-First AI-Powered Police Complaint Assistance Platform

FIR-Sahayak is an AI-powered platform designed to make police complaint drafting more accessible through voice-based interaction. It helps users communicate their complaints in **Marathi, Hindi, and English**, converts speech into text, and generates structured FIR drafts with the help of AI.

Built as part of the **Great Indian AI Internship Challenge by Gnani AI**, the project demonstrates how speech AI and language technologies can support more accessible digital public services.

## 🎥 Project Demo

- **YouTube Demo:** [Watch FIR-Sahayak Demo](https://youtu.be/u7lhT1WctXw)
- **LinkedIn Post:** [View FIR-Sahayak Project Post](https://lnkd.in/p/dvjUKM_W)

---

## 🎯 Problem Statement

Many people find it difficult to write formal police complaints because of language barriers, limited familiarity with legal terminology, or difficulty expressing incidents in a structured format.

FIR-Sahayak aims to simplify this process by allowing users to describe an incident in their preferred language and receive assistance in preparing a structured complaint draft.

## ✨ Key Features

- 🎙️ **Voice-Based Complaint Input** – Record complaints naturally using a microphone.
- 🌐 **Multilingual Support** – Supports Marathi, Hindi, and English.
- 📝 **Speech-to-Text with Gnani Prisma** – Converts spoken complaints into text.
- 🤖 **AI-Powered FIR Drafting** – Generates structured FIR complaint drafts from user input.
- ❓ **Missing Information Detection** – Identifies missing details and asks follow-up questions.
- 🔄 **Draft Improvement** – Updates the complaint using additional information provided by the user.
- ⚖️ **Legal Section Suggestions** – Provides preliminary relevant legal-section references with a confidence indicator.
- 🔊 **Text-to-Speech with Gnani Timbre** – Reads generated complaint content aloud.
- 📄 **PDF Generation** – Allows users to download the generated FIR draft.

## 🧠 Gnani AI Integration

FIR-Sahayak integrates two Gnani AI technologies:

| Gnani AI Technology | Purpose |
|---|---|
| **Prisma** | Speech-to-text transcription of voice complaints |
| **Timbre** | Text-to-speech conversion for audio playback |

These integrations enable users to interact with the platform using voice instead of relying entirely on typing.

## 🛠️ Technology Stack

**Frontend**
- React
- TypeScript
- Tailwind CSS

**Backend**
- Python
- FastAPI

**Database**
- PostgreSQL

**AI and Voice Technologies**
- Gnani AI Prisma – Speech-to-Text
- Gnani AI Timbre – Text-to-Speech
- AI-powered FIR draft generation
- Legal-section reference suggestions

## 🔄 How It Works

1. **Select Language:** Choose Marathi, Hindi, or English.
2. **Record Complaint:** Describe the incident using the microphone.
3. **Transcribe Speech:** Gnani Prisma converts the voice recording into text.
4. **Review Transcript:** Check and edit the transcribed complaint.
5. **Generate FIR Draft:** AI creates an initial structured complaint draft.
6. **Answer Follow-up Questions:** The system identifies missing information and asks relevant questions.
7. **Update the Draft:** Additional details are incorporated into the complaint.
8. **Review Legal Suggestions:** View preliminary legal-section references and the confidence indicator.
9. **Listen and Download:** Use Gnani Timbre to listen to the draft and download it as a PDF.

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- PostgreSQL
- Gnani AI API credentials

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd fir-sahayak
```

### 2. Backend Setup

Create and activate a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory and configure the required environment variables.

Add your Gnani AI API credentials and database configuration according to the backend settings.

**Important:** Never commit API keys, passwords, or other secrets to GitHub.

Start the backend:

```bash
python -m uvicorn backend.main:app --reload
```

Backend API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:3000
```

## 🔐 Privacy and Responsible Use

- Users should review the generated complaint before using it.
- Legal-section suggestions are preliminary references, not definitive legal advice.
- The platform is intended to assist with complaint drafting; it does not officially register an FIR or replace police authorities or legal professionals.
- Do not upload or share sensitive personal information in public demonstrations.
- Keep API credentials and private configuration files out of the repository.

## 🚀 Future Scope

- Improved legal-reference coverage using current Indian criminal laws.
- Additional Indian language support.
- Better accessibility for users with limited digital literacy.
- Enhanced validation and complaint review workflows.
- Secure deployment and user-data protection improvements.

## 👩‍💻 Project Information

**Project Name:** FIR-Sahayak  
**Challenge:** Great Indian AI Internship Challenge  
**Organized by:** Gnani AI

Built to explore how multilingual voice AI can make essential public-service interactions more accessible.

---

⭐ If you find this project interesting, consider giving the repository a star!

