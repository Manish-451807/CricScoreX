# Deployment Guide

## GitHub Pages

1. Create a new GitHub repository, for example `cricket-scorer`.
2. Put the project files in the repository root.
3. Commit and push the project.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the main branch and `/ (root)` folder.
7. Save.
8. GitHub will provide the published site URL.

Because the application is a static HTML/CSS/JavaScript project, no server-side runtime is required.

## Netlify

1. Create a Netlify account.
2. Choose **Add new site → Import an existing project** if connecting GitHub, or use Netlify's manual deployment option.
3. Select the repository/folder.
4. No build command is required.
5. Set the publish directory to the project root.
6. Deploy.

## Vercel

1. Import the GitHub repository into Vercel.
2. Select the project root.
3. Leave the framework preset as a static/no-framework project when prompted.
4. No build command is required.
5. Deploy.

## Before Publishing

- Test every navigation link.
- Verify all JavaScript files load from `js/`.
- Verify `css/style.css` loads correctly.
- Test a complete match from creation to history.
- Test Player Stats after at least one completed match.
- Test the site at desktop and mobile widths.
