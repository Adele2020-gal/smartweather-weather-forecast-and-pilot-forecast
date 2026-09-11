# SmartWeather AI 🌦️✈️
> Hyper-local South African Weather Intelligence, Aviation Radar & Air Traffic Density Platform

SmartWeather AI is an advanced, full-stack weather forecasting and aeronautical safety system headquartered in **Boksburg, Gauteng, South Africa**, directly interfacing with the final approach corridors of **O.R. Tambo International Airport (FAOR)**.

---

## 🌐 Live URLs & South Africa Deployment

- **Live Application (Production / Shared Preview - South Africa Gateway):** [https://ais-pre-3ijlhapm4jmvn3po22ldzb-3058304760.africa-south1.run.app](https://ais-pre-3ijlhapm4jmvn3po22ldzb-3058304760.africa-south1.run.app)
- **Development Environment (South Africa Gateway):** [https://ais-dev-3ijlhapm4jmvn3po22ldzb-3058304760.africa-south1.run.app](https://ais-dev-3ijlhapm4jmvn3po22ldzb-3058304760.africa-south1.run.app)
- **Target GCP Region:** `africa-south1` (Johannesburg, South Africa)
- **Active Sandbox Fallback:** `europe-west2` (Container Host Proxy)

---

## 📌 App Description

SmartWeather AI delivers real-time, hyper-local meteorological and aviation intelligence tailored to the unique atmospheric conditions of South Africa's Highveld. It bridges ground-level weather forecasts with mission-critical aviation operations, pilot safety briefings, dynamic NOTAM monitoring, and real-time air traffic density corridors.

The platform continuously synthesizes multiple meteorological models with South African Weather Service (SAWS) radar feeds, Open-Meteo forecasts, and Google Maps geospatial layers to provide pilots, dispatchers, emergency responders, and everyday residents with actionable forecasts.

---

## ✨ Interesting & Key Factors

1. **Highveld Terminal Airspace & Boksburg Approach Corridors**
   - Centered around Boksburg, Gauteng (Lat: -26.2126, Lng: 28.2560), positioned under the critical final approach paths for FAOR Runways 03L and 03R and the VASUR holding stack.
   - Features a continuous real-time Air Traffic Density Engine calculating spacing separation, holding stack queuing, and approach delays based on weather severity.

2. **99% Consensus Multi-Model Machine Learning Ensemble**
   - Synthesizes ECMWF, GFS, ICON, and SAWS localized Highveld convective models into a weighted consensus forecast.
   - Calculates real-time confidence scores and variance metrics across rainfall, temperature, barometric pressure, and wind shear.

3. **3D Interactive Atmospheric Weather Sphere (Three.js / WebGL)**
   - Custom-rendered 3D interactive atmospheric sphere reflecting cloud cover density, lightning storm flash illumination, rain droplet vectors, and wind flow streamlines in real time.

4. **Aero Tactical NOTAM Radar & Google Maps Integration**
   - Combines vector radar sweeps with calibrated nautical mile range rings (5, 10, 15, 20 NM) with Google Maps satellite/hybrid layers.
   - Decodes raw ICAO NOTAM telegrams into clear operational hazards, runway closure warnings, navigation aid outages, and bird strike advisories.

5. **Aviation Density Altitude & Microburst Risk Engine**
   - Because the Highveld sits at ~5,550 feet (1,694 meters) above sea level, summer convective heat causes extreme density altitude spikes (often exceeding 8,500+ feet DA). The app computes real-time climb gradient penalties, true airspeed corrections, and low-level wind shear / microburst danger indices.

6. **Gemini AI Meteorological & Pilot Dispatch Briefing**
   - Integrates server-side Gemini 2.5 AI to analyze complex weather conditions and generate formal ICAO standard pilot weather briefings (METAR/TAF decodes, diversion aerodrome suggestions, fuel reserve advisories).

7. **Volumetric Rain & Flash Flood Forecasting**
   - Precise hourly precipitation accumulation tracking, soil saturation modeling, and flash flood alerts for low-lying Gauteng catchment zones.

---

## 🛠️ Technology Stack & Languages

- **Primary Language:** **TypeScript (100%)**
- **Frontend Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS with responsive, accessible dark-mode UI
- **3D Graphics & Animations:** Three.js / WebGL, Lucide React, Framer Motion
- **Maps & Geospatial:** Google Maps JavaScript API (@vis.gl/react-google-maps)
- **Backend & API Proxy:** Node.js + Express with TypeScript execution via `tsx` / `esbuild`
- **AI Engine:** Google Gemini API (`@google/genai`)

---

## 🔒 GitHub Language Lock Configuration

To ensure GitHub's Linguist detection engine accurately represents the project as **TypeScript** and prevents automatic language shifts or encoding changes:
- Configured `.gitattributes` with `linguist-language=TypeScript` for all `.ts` and `.tsx` source code.
- Non-TypeScript markup, styles, metadata, and lockfiles are flagged as `linguist-detectable=false` or `linguist-generated=true`.
- Enforces strict line ending preservation (`* text=auto eol=lf`) to prevent Git from altering whitespace across different developer platforms.
