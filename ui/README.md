# Upwork Assistant UI

Next.js 14 app for viewing scored jobs and managing freelancer profile & preferences.

## Pages
- `/` Jobs dashboard (All Jobs / Above Threshold tabs)
- `/profile` Profile Sources & Preferences tabs

## Components
- JobsDashboard: fetches and toggles job lists
- ProfileTabs: manage sources + drag-n-drop skill priority
- JobList / ScoreBadge: job display

## API Routes
- `GET /api/jobs` returns placeholder job list

## Dev
```bash
npm install
npm run dev
```

Configure future backend base URL via env: `NEXT_PUBLIC_API_BASE=http://localhost:8000`.
