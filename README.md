# EnviroMonitor System

A frontend-only environmental monitoring mini project with role-based login flow and dashboard routing.

## Project Overview

This project provides a web interface for:
- User authentication (signup and login)
- Role selection (Industry or Monitoring Agency)
- Role-based dashboard access
- Air quality data entry with permissible limit checks
- AQI calculation with category and dominant pollutant summary

Authentication and user records are currently stored in browser localStorage for demo/testing.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6)
- Browser localStorage (temporary frontend auth storage)

## Project Structure

- login.html: User login page
- signup.html: User registration page
- agency-dashboard.html: Monitoring agency dashboard with AQI workflow
- industry-dashboard.html: Industry dashboard placeholder page
- index.html: Legacy/alternate dashboard page layout
- style.css: Shared styling for auth and dashboard pages
- script.js: App logic (auth, routing, limits, status, AQI)

## Current Air Unit Behavior

In the Monitoring Agency air quality table:
- A common unit dropdown is available in the Unit header.
- Supported units are ug/m3 and mg/m3.
- Changing the unit updates displayed permissible limits and status checks.

## How to Run

Because this is a static frontend project, no backend server is required.

### Option 1: Open directly
1. Open login.html in a browser.

### Option 2: Use VS Code Live Server (recommended)
1. Install Live Server extension in VS Code.
2. Right-click login.html.
3. Click Open with Live Server.

## Demo Flow

1. Go to signup.html and create an account with a role.
2. Login using the same credentials on login.html.
3. You will be redirected based on selected role:
   - agency -> agency-dashboard.html
   - industry -> industry-dashboard.html
4. In agency dashboard, select industry and date.
5. Enter pollutant values and click Calculate AQI.

## Notes and Limitations

- This is frontend-only and not secure for production authentication.
- Passwords are stored in localStorage for demonstration purposes.
- Save Data and Generate Report buttons are placeholders for future backend integration.

## Future Improvements

- Integrate backend authentication and database (for example Java Servlet + MySQL)
- Add report persistence and download/export
- Add water quality monitoring section
- Add role-specific profile management and settings
