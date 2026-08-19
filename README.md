# Campus Energy AI

SAGE – Smart AI for Green Energy

AI-Powered Smart Campus Energy Intelligence Platform

Overview

SAGE is an AI-powered Smart Campus Energy Intelligence Platform designed specifically for educational institutions. It helps universities monitor, analyze, predict, and optimize energy consumption across classrooms and campus buildings.

The system combines IoT sensor data (or a realistic simulator), real-time analytics, and Google's Gemini AI to help campus administrators reduce electricity costs, detect energy waste, improve sustainability, and make informed operational decisions.

For the hackathon, Varendra University serves as the pilot campus and demonstration environment.

Problem Statement

Universities consume a significant amount of electricity every day.

Common problems include:

Lights and fans left running in empty classrooms

High electricity bills

No centralized real-time monitoring

Delayed maintenance

No AI-powered analysis

Limited visibility into energy waste

Difficulty predicting future consumption

These issues increase operational costs while reducing energy efficiency.

Proposed Solution

SAGE continuously monitors classroom energy usage, processes data in real time, detects inefficiencies, and provides AI-powered recommendations that help administrators make better decisions.

Instead of reacting after electricity has already been wasted, SAGE enables proactive energy management.

System Workflow

IoT Sensors / Sensor Simulator

            │

            ▼

Real-Time Backend

(Express + Socket.IO)

            │

            ▼

Firebase Firestore

            │

            ▼

Analytics Engine

            │

            ▼

Context Builder

            │

            ▼

Google Gemini AI

            │

            ▼

Dashboard + AI Recommendations + Reports

Core Features

1. Real-Time Energy Monitoring

Monitor:

Buildings

Classrooms

Lights

Fans

Devices

Occupancy

Temperature

Live power consumption

All updates appear instantly using WebSockets.

2. IoT Sensor Simulator

For demonstration purposes, the platform includes a realistic sensor simulator.

It automatically simulates:

Students entering classrooms

Lights turning on

Fans turning on

Energy consumption changes

Empty classrooms

Forgotten lights

Device failures

High energy usage

Power spikes

The dashboard continuously updates, making the system feel alive during the presentation.

3. Analytics Engine

Processes raw sensor data into useful insights.

Calculates:

Current energy usage

Daily usage

Weekly usage

Monthly usage

Building statistics

Campus statistics

Peak usage

Idle consumption

Waste percentage

Energy efficiency score

4. AI Energy Guardian

Powered by Google Gemini.

Users can ask questions like:

Why is Room C-302 consuming so much electricity?

Which classroom wastes the most energy?

How can we reduce today's electricity bill?

Which building is least efficient?

Summarize today's campus performance.

The AI receives structured summaries rather than raw sensor logs, improving efficiency and reducing token usage.

5. Automatic Recommendations

The AI generates recommendations such as:

Turn off unused lights

Turn off fans after class

Schedule maintenance

Replace inefficient devices

Reduce peak-hour consumption

Each recommendation includes:

Priority

Reason

Estimated savings

Environmental impact

Confidence level

Suggested action

6. Smart Alerts

Automatically detects:

Empty rooms consuming electricity

High power consumption

Device failures

Unexpected occupancy

Offline devices

Each alert can be explained by AI.

7. Predictive Analytics

Forecasts:

Next hour

Today

Tomorrow

Weekly usage

Monthly trend

Annual estimate

Includes confidence scores and expected savings.

8. Executive Dashboard

Designed for university management.

Displays:

Campus KPIs

Energy trends

Cost analysis

Building comparisons

Efficiency scores

Sustainability metrics

AI executive summaries

Annual savings projections

9. Reports

Generate:

Daily reports

Weekly reports

Monthly reports

Each report includes:

Executive summary

Campus overview

Building comparison

Room analysis

Alerts

Cost analysis

Predictions

AI recommendations

Reports can be exported.

10. Sustainability Metrics

Track:

Estimated CO₂ emissions

CO₂ reduction

Annual savings

Environmental impact

Campus sustainability score

Dashboard Pages

The application includes:

Dashboard

Buildings

Classrooms

Devices

Energy Analytics

AI Insights

Predictions

Alerts

Reports

Executive Dashboard

Settings

All pages share a consistent enterprise-style design.

Technology Stack

Frontend

Next.js 15

React 19

Tailwind CSS

TypeScript

Backend

Node.js

Express.js

Socket.IO

Database

Firebase Firestore

AI

Google Gemini API

Validation

Zod

Architecture

Monorepo

Shared TypeScript models

Modular services

REST APIs

Real-time WebSockets

Token Optimization

Instead of sending hundreds of sensor records to the AI, the backend preprocesses the data into concise summaries.

This:

Reduces API cost

Improves response speed

Prevents unnecessary token usage

Makes AI responses more reliable

Business Value

SAGE helps universities:

Reduce electricity costs

Detect waste automatically

Improve operational efficiency

Support sustainability goals

Make data-driven decisions

Improve facility management

The platform is designed so it can be deployed to other educational institutions with minimal configuration.

Hackathon Innovation

SAGE combines:

Real-time IoT simulation

Live analytics

AI-powered recommendations

Predictive forecasting

Executive reporting

Sustainability metrics

Token-optimized AI architecture

into a single intelligent campus management platform.

Demo Flow

Open the dashboard with live campus metrics.

The simulator generates realistic classroom activity.

An empty classroom continues consuming electricity.

The system automatically raises an alert.

AI explains the issue and recommends corrective actions.

The dashboard displays estimated cost and energy savings.

Predictions forecast future consumption.

An executive report is generated summarizing the campus energy status.

I just need the front end

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sage-campus-spark.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/93a4a61f-8167-4069-8bb9-6cb630155163).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
