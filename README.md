# CineVerse AI

Build a **fully responsive, dynamic AI-powered Movie Suggestion Web Application** in lovable.

The application should have a modern, premium streaming-platform-inspired UI, but **do not copy the exact design, branding, or assets of Netflix/IMDb**. Create an original visual identity.


## 1. Technology Stack

Use:

* HTML5

* CSS3

* JavaScript (ES6+)

* React.js if appropriate for a better dynamic experience

* LocalStorage as the local database

* REST APIs / public movie APIs where appropriate

* AI integration for personalized movie recommendations

* No paid backend services required

* The application must run directly in Replit

Use clean, modular, maintainable code.

---

# 2. Application Name

Use a modern name such as:

**CineAI – Smart Movie Recommendations**

Create a professional logo/text-based brand identity for CineAI.

---

# 3. Authentication System

Create a complete authentication flow using LocalStorage.

### Pages:

1. Login

2. Register / Sign Up

3. Forgot Password UI

4. Home

5. Movie Details

6. AI Recommendations

7. Favorites

8. Watchlist

9. Profile

10. Settings

### Registration

Allow users to create an account with:

* Full Name

* Email

* Password

* Confirm Password

Store user information securely in LocalStorage for this frontend-only project.

IMPORTANT:

Since this is a LocalStorage-based demo, clearly structure authentication so that it can later be replaced by Firebase, Supabase, MongoDB, or another backend.

Do NOT pretend LocalStorage provides production-grade password security.

### Login

Allow users to log in using:

* Email

* Password

After successful login:

**Redirect automatically to Home.**

Prevent unauthenticated users from accessing protected pages.

If a user is not logged in and tries to access Home, Favorites, Watchlist, Profile, etc., redirect them to Login.

---

# 4. Main Navigation

After login, display a responsive navigation bar.

Navigation items:

* 🏠 Home

* 🎬 Movies

* 🤖 AI Suggestions

* ❤️ Favorites

* 📋 Watchlist

* 🔥 Trending

* 👤 Profile

Include:

* Search bar

* Notification icon

* Theme toggle

* User avatar/profile menu

* Logout button

On mobile:

Use a responsive hamburger menu or bottom navigation.

Navigation should work without unnecessary page reloads.

---

# 5. Home Page

Create a visually impressive home page.

Hero section:

* Large featured movie

* Movie poster/backdrop

* Movie title

* Rating

* Release year

* Genres

* Language

* Short description

* "View Details" button

* "Add to Watchlist" button

* "Favorite" button

* "IMDb" button

Create sections such as:

### Trending Now

Display currently popular movies.

### AI Picks For You

Personalized movie recommendations based on:

* Favorite genres

* Previously viewed movies

* Watchlist

* Ratings

* Search history

* Preferred languages

* Preferred release years

### Popular Movies

### Top Rated

### Recently Added

### Action & Adventure

### Comedy

### Romance

### Thriller

### Sci-Fi

### Horror

### Animation

Use horizontally scrollable movie cards on desktop/mobile.

---

# 6. Movie Cards

Every movie card should contain:

* Poster

* Movie title

* Release year

* IMDb rating

* Genres

* Language

* Favorite button

* Watchlist button

Add hover effects:

* Slight scale animation

* Shadow/glow

* Movie information overlay

* Quick actions

Clicking a movie card should open the **Movie Details page/modal**.

---

# 7. Movie Details Page

When the user clicks a movie, show:

* Large backdrop

* Movie poster

* Title

* Release date/year

* IMDb rating

* Runtime

* Genres

* Languages

* Director

* Cast

* Description

* Trailer button

* Favorite button

* Watchlist button

Most importantly:

### IMDb Button

Add:

**"View on IMDb"**

When clicked, redirect the user to the movie's correct IMDb page.

Example:

https://www.imdb.com/title/tt...

Do not generate fake IMDb IDs.

If an IMDb ID is available from the movie API, use it.

Open IMDb in a new browser tab.

---

# 8. Search

Implement a powerful real-time search system.

Search by:

* Movie title

* Actor

* Director

* Genre

* Language

* Year

Example:

User searches:

"Interstellar"

Immediately show matching movies.

Show a "No results found" state when appropriate.

Add search suggestions/autocomplete.

---

# 9. Filters

Create an advanced filter panel.

Filters:

### Genre

* Action

* Adventure

* Animation

* Comedy

* Crime

* Documentary

* Drama

* Fantasy

* Horror

* Mystery

* Romance

* Sci-Fi

* Thriller

### Year

* 2026

* 2025

* 2024

* 2023

* 2022

* 2021

* Older

Also allow a custom year range.

### Language

Include:

* English

* Hindi

* Telugu

* Tamil

* Malayalam

* Kannada

* Korean

* Japanese

* Spanish

* French

* Chinese

* Other

### Rating

* 9+

* 8+

* 7+

* 6+

### Sort

* Popularity

* Rating

* Latest

* Oldest

* A-Z

Filters should update the movie results dynamically without refreshing the page.

---

# 10. AI Movie Recommendation System

Integrate AI into the application.

Create an **AI Movie Assistant**.

Users can type natural-language requests such as:

"I want a mind-bending sci-fi movie like Interstellar."

"I want a funny Telugu movie from the last 5 years."

"Suggest some thriller movies for tonight."

"I want movies similar to Inception."

"I want highly rated Korean movies."

The AI should understand the request and recommend suitable movies.

Display:

* Movie title

* Reason for recommendation

* Genre

* Year

* Rating

* Language

* IMDb link

Create a beautiful AI chat interface.

Example:

User:

> Suggest 5 emotional movies similar to The Green Mile.

AI:

> Here are 5 movies you might enjoy...

Each recommendation should have:

**View Movie →**

---

# 11. AI Integration

Design the application so that the AI API key is NEVER exposed in frontend code.

If using an AI API:

Frontend → Replit backend/server → AI API

Store API keys using **Replit Secrets / environment variables**.

Create a backend API endpoint such as:

`/api/recommend`

The frontend sends the user's request to this endpoint.

The backend securely communicates with the AI provider.

If an AI API key is unavailable, implement a fallback recommendation engine using the local movie dataset instead of breaking the application.

---

# 12. Movie Data API

Use a reliable movie API where possible.

Prefer an API that provides:

* Movie title

* Poster

* Backdrop

* Description

* Release date

* Genre

* Language

* Rating

* IMDb ID

* Cast

* Director

* Runtime

Cache fetched movie data locally where appropriate.

If the API is unavailable:

Use a well-structured local JSON movie dataset as a fallback.

Do not hardcode everything directly inside JavaScript components.

---

# 13. LocalStorage Database

Use LocalStorage for the application's local database.

Create structured storage such as:

`cineai_users`

`cineai_current_user`

`cineai_favorites`

`cineai_watchlist`

`cineai_search_history`

`cineai_user_preferences`

`cineai_recently_viewed`

`cineai_movie_cache`

Store data per user.

Example:

```javascript

{

  userId: "user_001",

  favorites: [],

  watchlist: [],

  preferences: {

    genres: [],

    languages: [],

    yearRange: []

  }

}

```

When a user logs out and another user logs in, their favorites/watchlist/preferences must remain separate.

---

# 14. Real-Time Updates

Make the UI update immediately whenever:

* Favorite is added/removed

* Watchlist item is added/removed

* User preference changes

* Search history changes

* AI recommendations are generated

* Movie data is updated

Do not require a page refresh.

Use:

* Custom events

* State management

* Storage events where appropriate

* Reactive rendering

Display toast notifications such as:

"Added to Favorites ❤️"

"Removed from Watchlist"

"Preferences updated"

---

# 15. Favorites

Create a Favorites page.

Users can:

* Add movies

* Remove movies

* Search favorites

* Filter favorites

* Sort favorites

Show an attractive empty state:

"No favorite movies yet."

Button:

"Discover Movies"

---

# 16. Watchlist

Create a Watchlist page.

Users can:

* Add movies

* Remove movies

* Mark movies as watched

* Filter watched/unwatched

* Sort by date added

Display progress/status indicators.

---

# 17. Trending Page

Create a Trending page with:

* Trending today

* Trending this week

* Popular movies

* Top-rated movies

* Recently released movies

Use API data when available.

---

# 18. Profile Page

Display:

* Profile avatar

* Name

* Email

* Favorite genres

* Preferred languages

* Favorite movies count

* Watchlist count

* Watched movies count

Allow users to edit:

* Name

* Profile image/avatar

* Preferred genres

* Preferred languages

* Preferred year range

Save changes to LocalStorage immediately.

---

# 19. Settings

Create:

* Dark / Light mode

* Language preference

* Notification preference

* Autoplay preference

* Clear search history

* Clear cached movies

* Clear favorites

* Clear watchlist

* Delete account

* Logout

Ask for confirmation before destructive actions.

---

# 20. Theme

Default theme:

**Dark cinematic UI**

Use:

* Deep black/dark navy background

* Glassmorphism cards

* Subtle gradients

* Cinematic movie imagery

* Soft shadows

* Modern typography

* Rounded cards

* Smooth transitions

Also provide:

**Light Mode**

The selected theme should persist in LocalStorage.

---

# 21. Responsive Design

The application MUST be fully responsive.

Support:

* Desktop

* Laptop

* Tablet

* Mobile

Breakpoints should be properly implemented.

Movie grids should automatically adapt.

Example:

Desktop:

5–6 movies per row

Tablet:

3–4 movies per row

Mobile:

2 movies per row

Navigation should transform into a mobile-friendly menu.

---

# 22. Modern UI/UX Features

Add modern features including:

* Skeleton loaders

* Lazy-loaded images

* Smooth page transitions

* Toast notifications

* Empty states

* Loading states

* Error states

* Search autocomplete

* Debounced search

* Infinite scrolling or pagination

* Favorite animations

* Watchlist animations

* Keyboard-friendly navigation

* Accessible buttons

* Tooltips

* Responsive modal dialogs

Use semantic HTML and accessibility best practices.

---

# 23. PWA Features

Make the application optionally installable as a Progressive Web App.

Add:

* Web app manifest

* App icon

* Service worker

* Offline fallback

* Cached basic movie data

The application should continue showing cached movies when the internet connection is temporarily unavailable.

---

# 24. Performance

Optimize the application:

* Lazy load images

* Use responsive images

* Debounce search

* Cache API responses

* Avoid unnecessary DOM updates

* Use efficient filtering

* Minimize duplicate API requests

---

# 25. Error Handling

Handle:

* API unavailable

* Invalid API response

* Network failure

* AI API failure

* Missing movie poster

* Missing IMDb ID

* Invalid login

* Duplicate registration

* Empty search

* LocalStorage unavailable

Show user-friendly messages instead of technical errors.

---

# 26. Security

Although this is a LocalStorage demo:

* Never expose AI API keys

* Use Replit Secrets for API keys

* Validate user input

* Sanitize dynamically rendered content

* Do not use eval()

* Do not put secret keys in frontend JavaScript

* Clearly separate frontend and backend responsibilities

Add comments explaining that LocalStorage authentication is suitable only for a demo/prototype and should be replaced with secure server-side authentication for production.

---

# 27. Recommended Project Structure

Create a clean project structure similar to:

```text

cineai/

│

├── client/

│   ├── components/

│   ├── pages/

│   ├── services/

│   ├── utils/

│   ├── styles/

│   └── assets/

│

├── server/

│   ├── routes/

│   ├── controllers/

│   ├── services/

│   └── index.js

│

├── data/

│   └── movies.json

│

├── public/

│   ├── icons/

│   └── manifest.json

│

├── .env.example

├── package.json

└── README.md

```

Adapt the structure to the chosen React/Replit setup.

---

# 28. Demo Data

Include enough realistic demo movie data so the application looks complete immediately after launching.

Include movies from multiple:

* Genres

* Years

* Languages

* Ratings

Include a mix of:

* Hollywood

* Bollywood

* Telugu

* Tamil

* Korean

* Japanese

* European cinema

Store valid IMDb IDs only when known.

---

# 29. Dashboard Statistics

On the profile/dashboard, display:

* Movies watched

* Favorites

* Watchlist

* Favorite genre

* Favorite language

* Average rating of favorites

* Recently viewed

Use attractive animated statistic cards.

---

# 30. Recommendation Logic

If AI is unavailable, use a fallback recommendation algorithm.

Recommendation score can consider:

```text

Genre Match

+ Language Match

+ Rating

+ Release Year Preference

+ Similar Movies

+ Watch History

+ Favorite Movies

```

Sort recommendations by recommendation score.

---

# 31. Movie Similarity

On every Movie Details page, add:

### "You May Also Like"

Recommend movies based on:

* Similar genres

* Similar language

* Similar rating

* Similar release year

* Similar keywords

---

# 32. Real-Time Movie Updates

When new movie data is fetched from the API:

* Update the UI immediately

* Update the LocalStorage cache

* Mark newly discovered movies

* Update Trending/Recently Added sections

Do not overwrite user-specific favorites/watchlist data.

---

# 33. Notifications

Create an in-app notification center.

Examples:

"New movies matching your favorite genres are available."

"Your watchlist has 3 unwatched movies."

"New AI recommendations are ready."

Allow users to mark notifications as read.

Store notification state in LocalStorage.

---

# 34. Final UI Requirements

The final application should feel like a **real production-quality movie discovery platform**, not a basic college project.

Prioritize:

* Excellent UI

* Smooth animations

* Responsive design

* Fast interactions

* Clear navigation

* Good typography

* Professional spacing

* Consistent components

* Mobile usability

* Accessibility

Avoid excessive animations that make the site slow.

---

# 35. Important IMDb Requirement

Whenever a movie has a valid IMDb ID, construct its IMDb URL using:

`https://www.imdb.com/title/{IMDB_ID}/`

The **View on IMDb** button must open the actual IMDb movie page in a new tab.

Never redirect all movies to the IMDb homepage.

If no valid IMDb ID exists, hide or disable the IMDb button rather than creating a fake link.

---

# 36. Final Deliverable

Build the complete working application in Replit.

After implementation:

1. Make sure the project runs without errors.

2. Test registration.

3. Test login/logout.

4. Test protected routes.

5. Test movie search.

6. Test filters.

7. Test favorites.

8. Test watchlist.

9. Test profile.

10. Test theme switching.

11. Test AI recommendations.

12. Test IMDb redirects.

13. Test LocalStorage persistence.

14. Test responsive mobile layout.

15. Test API failure fallback.

16. Fix all console errors.

17. Add a professional README explaining setup and API configuration.

Use **Replit Secrets/environment variables** for all API keys.

The final result should be a polished, responsive, dynamic **AI Movie Recommendation Platform** that is ready to demonstrate as a professional full-stack project.
# CineAI – Major UI, Content, Navigation & Analytics Upgrade

Upgrade the **existing CineAI movie suggestion application**. Do NOT rebuild the entire application from scratch. Preserve all currently working features, authentication, AI recommendation system, LocalStorage functionality, movie APIs, IMDb links, favorites, watchlist, and existing data.

The goal is to transform CineAI into a **premium entertainment discovery platform** inspired by the visual quality and entertainment feel of modern streaming platforms and superhero entertainment websites, while maintaining an **original CineAI identity**.

Do not directly copy Netflix, IMDb, Marvel, or any other company's copyrighted UI, logo, branding, or assets.

---

# 1. NEW MAIN NAVIGATION

Replace the current navigation with exactly these primary navigation items:

1. 🏠 Home

2. 🎬 Movies

3. 🔍 Search

4. 📺 Series

5. 📋 Watchlist

6. ❤️ Favourites

7. ✅ Watched

8. 🎭 Genres

Navigation should be extremely clean and prominent.

### Desktop

Use a premium horizontal navigation bar:

```text

CineAI | Home | Movies | Search | Series | Watchlist | Favourites | Watched | Genres

```

Right side:

* Search icon

* Notification icon

* Theme toggle

* User avatar

* Profile dropdown

* Logout

### Mobile

Use a responsive bottom navigation or hamburger menu.

Prioritize:

```text

Home | Movies | Search | Watchlist | Favourites

```

Put the remaining navigation options inside the menu.

Navigation must remain accessible while scrolling.

Use a sticky/floating navigation bar with a subtle blur/glass effect.

---

# 2. NEW CINEAI LOGO

Replace the current logo completely.

Create a professional entertainment brand logo:

**CineAI**

Logo concept:

* Modern cinematic typography

* Minimal film/cinema symbol

* AI-inspired subtle element

* Premium white/dark contrast

* Small cinematic glow

* Professional enough for a real entertainment startup

Do NOT use Netflix, IMDb, Marvel, or any existing company logo.

The logo should have a subtle entrance animation when the website loads.

---

# 3. VISUAL DESIGN

Completely improve the visual design.

The design should combine:

### Premium streaming platform feel

*

### Cinematic entertainment website feel

*

### Modern AI application

Prefer **white and light colors** as the primary interface.

Use:

* White

* Off-white

* Soft gray

* Charcoal

* Black

* Very subtle red accent

* Very subtle cinematic gradients

Avoid overly bright colors.

The website should look elegant and premium rather than flashy.

---

# 4. COLOR SYSTEM

Create a consistent design system.

### Primary

White / off-white backgrounds.

### Text

Dark charcoal / black.

### Secondary

Soft gray.

### Accent

Use a controlled cinematic red accent for:

* Active navigation

* Buttons

* Favorite icons

* Important CTAs

* Progress indicators

* Notifications

Use red sparingly.

Avoid making the entire website red.

---

# 5. CINEMATIC HERO SECTION

Redesign the Home page hero section.

Display a large featured movie/series.

Include:

* Large cinematic backdrop

* Gradient overlay

* Movie/series poster

* Title

* Rating

* Release year

* Genres

* Language

* Runtime

* Description

* IMDb rating

* AI recommendation score

Buttons:

```text

▶ Watch Trailer

＋ Add to Watchlist

❤️ Favourite

ℹ View Details

```

Add smooth cinematic animations.

When the hero changes:

* Fade transition

* Image zoom

* Text slide

* Subtle background movement

Do not make animations excessive.

---

# 6. MOVIE CARDS

Redesign movie cards to look like professional streaming/movie discovery cards.

Each card should include:

* High-quality movie poster

* Movie title

* Year

* IMDb rating

* Genre

* Language

* HD/quality indicator if available

* Favourite button

* Watchlist button

On hover:

* Slight scale

* Soft shadow

* Poster zoom

* Information overlay

* Quick action buttons

Clicking a movie should open the existing Movie Details page.

---

# 7. IMDb-STYLE MOVIE INFORMATION

Improve movie information presentation.

Movie details should visually prioritize:

* Poster

* Title

* IMDb rating

* Release year

* Runtime

* Genre

* Language

* Director

* Cast

* Description

* Trailer

* IMDb link

Use an IMDb-inspired information hierarchy, but create an original CineAI layout.

The IMDb button must redirect to the movie's actual IMDb page when a valid IMDb ID exists.

Use:

```text

https://www.imdb.com/title/{IMDB_ID}/

```

Never generate fake IMDb IDs.

---

# 8. ADD MANY MORE TELUGU MOVIES

This is a major requirement.

Expand the movie database significantly with Telugu content.

Include movies from:

### Telugu Cinema

Add popular and highly rated Telugu movies across:

* Action

* Romance

* Comedy

* Thriller

* Crime

* Drama

* Sci-Fi

* Fantasy

* Family

* Historical

* Mythological

* Horror

Include movies from different periods:

* Classic Telugu movies

* 1990s

* 2000s

* 2010–2019

* 2020–2024

* 2025

* Latest available releases

Include a mixture of:

* Blockbusters

* Critically acclaimed movies

* Cult classics

* Underrated movies

* Recent releases

Do not invent movie information.

Use reliable movie API data wherever possible.

Include Telugu movie metadata:

* Title

* Poster

* Backdrop

* Release year

* Rating

* Genres

* Language

* Cast

* Director

* Description

* IMDb ID when available

---

# 9. TELUGU CONTENT SECTION

Create a dedicated section on Home:

## "Best of Telugu Cinema"

Subsections:

### Telugu Blockbusters

### Telugu Classics

### New Telugu Releases

### Telugu Action

### Telugu Romance

### Telugu Comedy

### Telugu Thrillers

### Telugu Family Movies

### Telugu Sci-Fi & Fantasy

Create a "View All Telugu Movies" button.

---

# 10. SERIES SECTION

Add a completely new **Series** section.

Navigation:

**Series**

Categories:

* Trending Series

* Popular Series

* New Series

* Top Rated Series

* Telugu Series

* Indian Series

* Korean Series

* English Series

* Crime Series

* Thriller Series

* Sci-Fi Series

* Comedy Series

* Drama Series

Series cards should display:

* Poster

* Title

* Year

* Rating

* Seasons

* Episodes

* Genres

* Language

Create a Series Details page.

---

# 11. SEARCH PAGE

Create a dedicated Search page.

Search for:

* Movies

* Series

* Actors

* Directors

* Genres

* Languages

* Years

Add real-time search.

Example:

```text

Search "Prabhas"

```

Display matching movies and series.

Add autocomplete suggestions.

Use debouncing to avoid unnecessary API calls.

---

# 12. GENRES PAGE

Create a visually attractive Genres page.

Display large genre cards:

* Action

* Adventure

* Animation

* Comedy

* Crime

* Documentary

* Drama

* Fantasy

* Horror

* Mystery

* Romance

* Sci-Fi

* Thriller

* Family

* Historical

Also include language-specific genre discovery:

```text

Telugu

Hindi

Tamil

Malayalam

Kannada

English

Korean

Japanese

Spanish

French

```

Clicking a genre should dynamically show relevant content.

---

# 13. WATCHLIST

Improve the Watchlist page.

Show:

* Poster

* Title

* Rating

* Year

* Genre

* Added date

* Watched/unwatched status

Actions:

* Remove

* Mark as Watched

* Favourite

* View Details

Add sorting:

* Recently Added

* Rating

* Year

* A-Z

---

# 14. FAVOURITES

Improve the Favourites page.

Show:

* Favourite movies

* Favourite series

Create separate tabs:

```text

Movies | Series

```

Add:

* Search

* Sort

* Filter

* Remove favourite

* Add to Watchlist

---

# 15. WATCHED PAGE

Create a completely new **Watched** page.

Track movies and series that the user marks as watched.

Display:

* Poster

* Title

* Date watched

* Rating

* Genre

* Language

Add statistics:

```text

Movies Watched

Series Watched

Total Watch Time

Favourite Genre

Most Watched Language

```

---

# 16. PERSONALIZED TARGET SYSTEM

Add a user entertainment target system.

Create a section:

## "Your Entertainment Goal"

Allow users to set:

### Monthly Movie Target

Example:

```text

10 movies / month

```

### Monthly Series Target

Example:

```text

2 series / month

```

### Weekly Watch Target

Example:

```text

5 hours / week

```

Store targets in LocalStorage.

Display progress:

```text

Movies

████████░░ 8/10

Series

██████░░░░ 3/5

Watch Time

███████░░░ 14/20 hours

```

Show encouraging messages such as:

"You're 80% toward your monthly movie goal!"

Do not make the system addictive or encourage excessive viewing.

---

# 17. USER ANALYTICS DASHBOARD

Create a professional analytics dashboard.

Add a new section:

## "Your CineAI Analytics"

Display:

### Overview

* Total Movies Watched

* Total Series Watched

* Total Watch Time

* Favourites

* Watchlist Size

### Genre Analytics

Show the user's most watched genres.

Example:

```text

Action      35%

Drama       25%

Thriller    20%

Comedy      12%

Romance      8%

```

### Language Analytics

Example:

```text

Telugu      45%

English     30%

Hindi       15%

Korean      10%

```

### Monthly Activity

Create a chart showing:

```text

Jan

Feb

Mar

Apr

May

Jun

Jul

Aug

```

with number of movies watched.

### Rating Analytics

Show the average rating of movies the user has watched/favourited.

Use clean charts.

Do not use excessive colors.

---

# 18. AI PERSONALIZATION

Improve the existing AI recommendation system.

AI should analyze:

* Favourite movies

* Watchlist

* Watched movies

* Favorite genres

* Preferred languages

* Preferred years

* Search history

* Ratings

Then generate:

## "Made For You"

Example:

```text

Because you liked RRR...

You may enjoy:

Baahubali

Pushpa

Salaar

Eega

```

Include an explanation:

"Recommended because you frequently watch Telugu action movies with high ratings."

---

# 19. AI ENTERTAINMENT ASSISTANT

Keep the existing AI assistant but redesign it.

Create:

### CineAI Assistant

Example prompts:

```text

Suggest a Telugu thriller for tonight

Give me movies similar to Interstellar

Find highly rated Telugu action movies

Suggest a family movie under 2 hours

What should I watch after RRR?

Recommend 5 Korean thrillers

```

Display recommendations as interactive movie cards.

Each AI recommendation should provide:

* Poster

* Title

* Rating

* Year

* Genre

* Language

* Reason

* View Details

* IMDb

Keep API keys on the backend only.

---

# 20. REAL-TIME UPDATES

The application must update immediately when:

* Favourite changes

* Watchlist changes

* Movie is marked watched

* Series is marked watched

* User changes preferences

* Analytics change

* Target progress changes

* AI recommendations update

No manual page refresh should be necessary.

Use React state/context or an equivalent reactive architecture.

Synchronize important data with LocalStorage.

---

# 21. LOGIN DETAILS & USER DATA

Preserve the existing authentication system.

Store user profile information locally so users can log back in on the same browser.

Maintain separate user data for each account.

Store:

```text

User

Profile

Preferences

Favorites

Watchlist

Watched

Search History

Analytics

Targets

Notifications

```

under the appropriate user identity.

IMPORTANT:

This is a frontend/demo authentication system using LocalStorage.

Do NOT claim it is production-secure.

Never store passwords in plain text if there is a backend available. If authentication remains frontend-only, clearly document that it is a prototype and should be replaced with secure server-side authentication for production.

---

# 22. PROFILE

Improve the Profile page.

Display:

```text

Profile Photo

Name

Email

Movies Watched

Series Watched

Favourites

Watchlist

Favourite Genre

Favourite Language

Monthly Goal

Current Progress

```

Allow editing:

* Name

* Avatar

* Favourite genres

* Favourite languages

* Preferred years

---

# 23. ANIMATIONS

Make the website entertaining with professional animations.

Add:

### Page transitions

Smooth fade/slide.

### Movie cards

Subtle hover scale.

### Hero

Slow cinematic background zoom.

### Buttons

Small hover/press animation.

### Logo

Elegant entrance animation.

### Loading

Skeleton animations.

### Favorite

Small heart animation.

### Watchlist

Small confirmation animation.

### Analytics

Charts animate when entering the viewport.

Avoid excessive animations.

The website should remain fast and professional.

---

# 24. CINEMATIC COLOR GRADING

Apply subtle cinematic color grading to movie images.

Use:

* Soft contrast

* Dark gradient overlays

* Subtle vignette

* Smooth shadows

Do not distort movie posters.

Do not apply heavy filters that reduce image quality.

---

# 25. HOME PAGE CONTENT ORDER

Use this structure:

```text

Navigation

Hero Featured Movie

Trending Now

AI Picks For You

Popular Movies

New Releases

Best of Telugu Cinema

Top Rated Movies

Popular Series

Telugu Series

Action

Thriller

Romance

Comedy

Recently Viewed

Footer

```

Make every section horizontally scrollable where appropriate.

---

# 26. FOOTER

Create a professional footer.

Include:

```text

CineAI

AI-powered movie & series discovery

Movies

Series

Genres

Watchlist

Favourites

About

Privacy

Terms

Contact

```

Add social icons.

Use an original CineAI visual identity.

---

# 27. RESPONSIVE DESIGN

Ensure the entire website works perfectly on:

* 1440px desktop

* 1200px laptop

* 768px tablet

* 480px mobile

* 360px mobile

Do not allow:

* Horizontal overflow

* Broken cards

* Overlapping navigation

* Cropped buttons

* Broken hero sections

Movie cards should dynamically adapt.

---

# 28. PERFORMANCE

Maintain fast performance.

Implement:

* Lazy loading

* Image optimization

* Debounced search

* API caching

* LocalStorage caching

* Skeleton loading

* Pagination/infinite scroll

* Avoid unnecessary API requests

---

# 29. EMPTY STATES

Create attractive empty states.

Examples:

### Empty Watchlist

"No movies waiting for you yet."

Button:

"Discover Movies"

### Empty Favourites

"Start building your favourite collection."

### Empty Watched

"Your watch history will appear here."

---

# 30. NOTIFICATIONS

Add an in-app notification center.

Examples:

```text

New Telugu movies added

Your monthly movie goal is 80% complete

New AI recommendations are ready

You have 5 unwatched movies in your Watchlist

```

Allow notifications to be marked as read.

Store notification state locally.

---

# 31. FINAL QUALITY REQUIREMENT

After making all changes:

### Test:

* Login

* Registration

* Logout

* Navigation

* Home

* Movies

* Search

* Series

* Watchlist

* Favourites

* Watched

* Genres

* Movie Details

* Series Details

* IMDb redirects

* AI recommendations

* Telugu content

* LocalStorage

* Analytics

* Targets

* Profile

* Theme

* Mobile responsiveness

Fix all:

* Console errors

* Broken links

* Missing images

* API failures

* Layout problems

* Navigation issues

* State synchronization issues

Do not remove any existing working feature unless it is being replaced by a better implementation.

---

# 32. FINAL DESIGN GOAL

The final CineAI website should feel like:

**Premium Streaming Platform**

+

**IMDb-style movie information**

+

**AI-powered recommendation engine**

+

**Modern superhero/entertainment website energy**

+

**Clean white premium interface**

The design should be:

* Elegant

* Cinematic

* Entertaining

* Modern

* Responsive

* Professional

* Fast

* AI-powered

Primary visual preference:

**80% white/light interface + 20% dark/cinematic elements**

Use red only as a subtle accent.

Do NOT clone Netflix, IMDb, or Marvel. Create an original and recognizable **CineAI** brand.

Most importantly, make the website feel like a **real entertainment product that users would enjoy exploring**, rather than a basic student project.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cine-spark-ai-78.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e30d8cd7-2ddc-414b-8025-0d278ce32b17).

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
