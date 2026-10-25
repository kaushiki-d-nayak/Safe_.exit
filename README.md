# SafeExit 🛡️
### Travel safer. Stay connected. Be prepared.

**SafeExit** is a travel-safety web application developed for **recHERsion Hackathon 2026**. It brings together personal safety tools, trip organization, suspicious travel-message assessment, emergency contingency planning, and discreet assistance in one platform.

The goal is to help travellers prepare for unexpected situations, stay connected with trusted contacts, and make more informed decisions throughout their journeys.

🌐 **Live Website:** [https://live-website-build.netlify.app/]

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#️-technology-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Safety and Privacy](#-safety-and-privacy)
- [Limitations](#-limitations)
- [Acknowledgements](#-acknowledgements)

## 💡 Overview

Travelling independently can involve uncertainty, unfamiliar surroundings, suspicious booking or payment requests, and situations where immediate assistance may be difficult to seek.

SafeExit brings several travel-safety needs into a single, accessible website. Rather than focusing on a single emergency feature, it combines preparation, awareness, communication, and contingency planning to support users before and during a journey.

## ✨ Features

### 1. 📍 Live Safety

Designed to help users stay connected with trusted contacts during a journey.

- **Location Sharing:** Share a private link with a trusted contact.
- **Safety Check-ins:** Set a deadline for confirming that you are safe.
- **Trusted-Contact Dashboard:** View shared safety information in one place.
- **Missed Check-in and SOS Alerts:** Intended to help trusted contacts respond when a check-in is missed or assistance is requested.
- **Expiring Sharing Sessions:** Support time-limited location sharing.

### 2. 🧳 Trip Overview & My Trips

A dedicated space for organizing travel information.

- Keep trip details organized.
- Review planned journeys in one place.
- Bring trip planning and personal safety tools into a unified experience.

### 3. 🔎 SafeExit Verify

Helps users assess potentially suspicious travel-related messages, booking requests, and payment communications.

- Identify possible warning signs in a message.
- Encourage verification through official booking platforms and payment channels.
- Provide practical next steps to help users make informed decisions.

**Important:** SafeExit Verify is an awareness and decision-support tool. Its assessment should not be treated as a definitive determination that a message is safe or fraudulent.

### 4. 🧭 Plan B Protocol

Encourages users to prepare for unexpected changes during a journey.

- Think through possible disruptions.
- Consider alternative plans.
- Identify practical next steps for uncertain situations.

### 5. 🤝 Discreet Help

Offers guidance for situations where asking for help openly may feel uncomfortable or unsafe.

- Provides discreet phrases and communication ideas.
- Suggests possible ways to seek assistance.
- Encourages users to consider their surroundings and prioritize personal safety.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure and content |
| CSS3 | Styling and layout |
| JavaScript | Client-side interactions and functionality |
| Netlify | Frontend hosting and deployment |

The deployment configuration also references Netlify Functions and database migrations. The exact backend implementation and its deployment status must be verified against the final source code before additional backend technologies are listed.

## 🚀 Getting Started

### Use the live website

Visit **[SafeExit](https://safeexit-phi.vercel.app/)** in your browser.

### Run the project locally

**Prerequisites**
- A modern web browser.
- A local development server.
- The project source code.

**Steps**

1. Clone or download the project repository.
2. Open the project folder in your code editor.
3. Start a local web server from the directory containing the website's entry point.
4. Open the local URL provided by the server in your browser.
5. Test the website's features and interactions.

For example, if Python is installed, you can start a basic server from the directory containing `index.html`:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

**Note:** This serves static files only. Features that depend on backend API routes, persistent storage, location services, or notifications require their corresponding services and configuration to be available.

## 📂 Project Structure

The frontend source includes the following files:

```text
SafeExit/
├── index.html
├── app.js
├── safety.css
├── safety.js
├── styles.css
├── trips.css
├── trips.js
└── netlify.toml
```

- `index.html` — Main HTML entry point.
- `app.js` — General client-side application logic.
- `styles.css` — Shared website styling.
- `safety.css` — Styling for safety-related interfaces.
- `safety.js` — Client-side safety feature logic.
- `trips.css` — Styling for trip-related interfaces.
- `trips.js` — Client-side trip feature logic.
- `netlify.toml` — Netlify deployment configuration.

The exact folder structure may vary depending on the final repository. Backend functions, migration files, environment configuration, and other assets should be included in the repository if they are required to run the complete application.

## 🔒 Safety and Privacy

SafeExit is designed to support more informed and prepared travel. Users should share personal or location information only with trusted contacts and review the permissions they grant to websites and services.

- Avoid sharing private links publicly.
- Verify suspicious bookings and payment requests through official channels.
- Do not rely exclusively on the website during an emergency.
- Contact the appropriate local emergency services when immediate assistance is needed.

## ⚠️ Limitations

SafeExit is a travel-safety support tool and does not guarantee personal safety, prevent every scam, or replace emergency services.

Features that depend on backend APIs, notifications, location access, or persistent data require those services to be correctly configured and operational. Their availability depends on the deployed implementation.

## 🙌 Acknowledgements

Developed as a project for **recHERsion Hackathon 2026**, with the aim of making travel safety more accessible, proactive, and practical.

---

<img width="1898" height="865" alt="image" src="https://github.com/user-attachments/assets/f4b15496-b5ff-41fb-8b69-5fc110e846a5" />

<img width="1900" height="607" alt="image" src="https://github.com/user-attachments/assets/88e0154e-4997-4662-a152-5204323792fb" />

<img width="1891" height="867" alt="image" src="https://github.com/user-attachments/assets/0e5d69ee-17d8-4490-bed3-1b2a432f1234" />

<img width="1510" height="720" alt="image" src="https://github.com/user-attachments/assets/d193304a-df2a-4738-9d60-784dd5749895" />

<img width="1485" height="777" alt="image" src="https://github.com/user-attachments/assets/7826059c-49f1-4ef2-8e5a-c6a4b375daaf" />



**SafeExit — Because being prepared is part of travelling safely.**
