# Deployment Guide

This project is a React application built with Vite. It can be easily deployed to various static site hosting providers.

## Prerequisites

- A GitHub account (recommended for continuous deployment).
- An account with a hosting provider (Vercel, Netlify, etc.).

## Option 1: Deploy to Vercel (Recommended)

1.  **Push to GitHub**: Ensure your project is pushed to a GitHub repository.
2.  **Import Project**: Go to [Vercel Dashboard](https://vercel.com/dashboard) and click "Add New..." -> "Project".
3.  **Select Repository**: Choose your GitHub repository.
4.  **Configure Project**:
    - **Framework Preset**: Vite
    - **Root Directory**: `./` (default)
    - **Build Command**: `npm run build` (default)
    - **Output Directory**: `dist` (default)
    - **Environment Variables**: Add any variables from your `.env` file if you have one (currently none used).
5.  **Deploy**: Click "Deploy".

*Note: A `vercel.json` file has been added to handle client-side routing.*

## Option 2: Deploy to Netlify

1.  **Push to GitHub**: Ensure your project is pushed to a GitHub repository.
2.  **New Site**: Go to [Netlify Dashboard](https://app.netlify.com/) and click "Add new site" -> "Import an existing project".
3.  **Select Repository**: Choose "GitHub" and select your repository.
4.  **Build Settings**:
    - **Base directory**: (leave empty)
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
5.  **Deploy**: Click "Deploy site".

*Note: A `netlify.toml` file has been added to handle client-side routing.*

## Option 3: Manual Build & Deploy

You can build the project locally and upload the `dist` folder to any static host.

1.  Run the build command:
    ```bash
    npm run build
    ```
2.  The output will be in the `dist` folder.
3.  Upload the contents of the `dist` folder to your server or hosting provider.
