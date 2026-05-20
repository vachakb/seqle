import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log(
  "%cHey Matiks Team! 👋",
  "color: #8B5CF6; font-size: 18px; font-weight: bold;"
);
console.log(
  "%cGlad you discovered this. This game was made in around 2-3 hours with Claude Code. The original idea was to make something related to calculus. As a huge fan of wordle and language in general, as well as Math, I wanted to combine the two. This was the simplest yet pretty fun idea I could come up with. If you had a good time playing and think my brain could be of use to Matiks, would love to connect with you :)\n\nNow i won't lie, I haven't been a consistent Matiks player. Played a bit here and then and then got super busy with work, had to sacrifice my weekends (you know how it is with startups, no complaints tho). But what you guys are doing is so interesting it stuck with me since the first time I discovered Matiks so I couldn't help but shoot my shot this time!\n\nLinkedIn: www.linkedin.com/in/vacha-buch-544568224",
  "color: #A78BFA; font-size: 13px; line-height: 1.6;"
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
