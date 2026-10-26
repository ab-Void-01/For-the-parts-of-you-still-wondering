/* ASTRA — lightweight interaction layer */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Elegant loading handoff
  window.addEventListener('load', () => setTimeout(() => $('.page-loader').classList.add('done'), 280), { once: true });

  // Navigation and header state
  const header = $('.site-header'), menu = $('.menu-toggle'), nav = $('nav');
  menu.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menu.classList.toggle('open', isOpen);
    menu.setAttribute('aria-expanded', isOpen);
  });
  $$('nav a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); menu.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
  }));

  // Single rAF scroll work: progress, header, back-to-top
  const progress = $('.progress i'), topButton = $('.to-top'); let scrollQueued = false;
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const percentage = max > 0 ? Math.round((scrollY / max) * 100) : 0;
    progress.style.width = `${percentage}%`;
    header.classList.toggle('scrolled', scrollY > 35);
    topButton.classList.toggle('visible', scrollY > 560);
    $('small', topButton).textContent = `${percentage}%`;
    scrollQueued = false;
  };
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();
  topButton.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  // Observer-powered reveal (does not keep scroll handlers alive)
  const reveals = $$('.reveal');
  reveals.forEach(el => el.style.setProperty('--delay', `${el.dataset.delay || 0}ms`));
  const observer = new IntersectionObserver((entries) => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), { threshold: .12, rootMargin: '0px 0px -35px' });
  reveals.forEach(el => observer.observe(el));

  // Split the quote only when it becomes visible; preserves accessible sentence.
  const quote = $('[data-quote]');
  const quoteObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const sentence = quote.dataset.quote;
    quote.innerHTML = [...sentence].map((letter, i) => `<span style="display:inline-block;opacity:0;transform:translateY(13px);transition:opacity .35s ease ${i * 15}ms,transform .35s ease ${i * 15}ms">${letter === ' ' ? '&nbsp;' : letter}</span>`).join('');
    requestAnimationFrame(() => $$('span', quote).forEach(char => { char.style.opacity = '1'; char.style.transform = 'none'; }));
    quoteObserver.disconnect();
  }), { threshold: .55 });
  quoteObserver.observe(quote);

  // Card tilt keeps writes limited to transforms.
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    $$('.tilt-card').forEach(card => {
      let frame;
      const move = event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => card.style.transform = `perspective(850px) rotateX(${-y * 7}deg) rotateY(${x * 8}deg) translateY(-8px)`);
      };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); card.style.transform = ''; });
    });

    // Cursor follower and soft mouse light use interpolation, not per-event layout.
    const dot = $('.cursor-dot'), aura = $('.cursor-aura'), light = $('.spotlight');
    let targetX = innerWidth / 2, targetY = innerHeight / 2, auraX = targetX, auraY = targetY, cursorFrame;
    const renderCursor = () => {
      auraX += (targetX - auraX) * .14; auraY += (targetY - auraY) * .14;
      dot.style.transform = `translate3d(${targetX - 3}px,${targetY - 3}px,0)`;
      aura.style.transform = `translate3d(${auraX - 18}px,${auraY - 18}px,0)`;
      light.style.transform = `translate3d(${targetX}px,${targetY}px,0)`;
      cursorFrame = requestAnimationFrame(renderCursor);
    };
    addEventListener('pointermove', e => { targetX = e.clientX; targetY = e.clientY; dot.style.opacity = aura.style.opacity = '1'; }, { passive: true });
    addEventListener('pointerout', e => { if (!e.relatedTarget) dot.style.opacity = aura.style.opacity = '0'; });
    $$('a, button, input, textarea').forEach(el => {
      el.addEventListener('pointerenter', () => aura.classList.add('active'));
      el.addEventListener('pointerleave', () => aura.classList.remove('active'));
    });
    cursorFrame = requestAnimationFrame(renderCursor);
  }

  // Count-up statistics only after they enter view.
  const stats = $$('[data-count]');
  const statsObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target, end = Number(el.dataset.count), start = performance.now(), duration = 900;
    const tick = now => { const progress = Math.min((now - start) / duration, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - progress, 3))); if (progress < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); statsObserver.unobserve(el);
  }), { threshold: .8 });
  stats.forEach(stat => statsObserver.observe(stat));

  // Static front-end contact affordances.
  $('.contact form').addEventListener('submit', event => {
    event.preventDefault();
    const message = $('.form-message', event.currentTarget);
    message.textContent = 'Thank you — your note is on its way.';
    event.currentTarget.reset();
  });
  $('.newsletter').addEventListener('submit', event => { event.preventDefault(); event.currentTarget.querySelector('input').placeholder = 'You’re on the list ✦'; event.currentTarget.reset(); });

  /* ---------------------------------------------------------------
     Reading content: stories + poems, and the reader/gallery modals
  ----------------------------------------------------------------*/
  const STORIES = {
    'quiet-geometry': {
      title: 'The quiet geometry of becoming', category: 'Featured story', tagClass: '',
      author: 'Mira Sol', date: 'June 18, 2026', readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "There is a shape to becoming that no one teaches you in school. It is not a straight line, and it is rarely graceful. It looks more like a spiral — the same lessons circling back at a slightly different altitude each time, until one day you notice you are standing somewhere new, even though the path felt like repetition.",
        "We tend to imagine growth as forward motion: a ladder, a staircase, a timeline with milestones. But most of the meaningful shifts in a life happen sideways, in the in-between hours when nothing appears to be happening at all. The quiet is not empty. It is where the geometry does its work.",
        "Consider how a coastline is shaped — not by a single dramatic wave, but by thousands of ordinary ones, arriving and retreating, arriving and retreating, until the rock remembers a different outline. Becoming works the same way. It is patient, unglamorous, and almost entirely invisible while it is happening.",
        "If you are in a season that feels like nothing is changing, it may be worth asking what shape is quietly forming beneath the surface. Not every transformation announces itself. Some of them simply wait until you turn around and notice the coastline has moved.",
        "The invitation, then, is not to force the next dramatic leap, but to trust the slow arithmetic of ordinary days — to let the tide do what only time and repetition can do."
      ]
    },
    'map-runs-out': {
      title: 'Where the map runs out', category: 'Adventure', tagClass: '',
      author: 'Elias Ward', date: 'June 12, 2026', readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Every trail has a point where the markers stop. The paint on the rocks fades, the path narrows to a suggestion, and you are left with nothing but your own reading of the land. Most people turn back here. This essay is about what happens if you don't.",
        "There is a particular kind of fear that shows up exactly where the map runs out — not the fear of danger, usually, but the fear of not knowing whether you're still doing it right. We are so trained to want confirmation that we forget how to trust our own footing.",
        "The trips I remember most clearly are never the ones that went according to plan. They're the ones where the plan dissolved and something more honest took its place — a wrong turn that led to a waterfall no guidebook mentioned, a closed trail that forced an afternoon of just sitting and watching weather move across a valley.",
        "Getting lost, in small and reversible ways, turns out to be one of the last remaining forms of genuine discovery available to an ordinary traveler. Everything else has been reviewed, rated, and photographed from the same six angles.",
        "So here is the modest proposal: on your next trip, let one afternoon go unplanned. Walk until the map runs out, and see what you notice when there is no longer anything to check against."
      ]
    },
    'humane-machine': {
      title: 'The humane machine', category: 'Technology', tagClass: 'cyan',
      author: 'Theo Marsh', date: 'June 04, 2026', readTime: '9 min read',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Every notification is a tiny request for a piece of you. Individually, they're nothing — a buzz, a badge, a flicker of red. Collected across a day, they add up to something closer to a toll on your attention, one you rarely agreed to pay in full.",
        "The tools we build are not neutral. They carry the incentives of whoever built them, and lately those incentives have optimized ruthlessly for one thing: how long you'll stay. Staying is not the same as being served. It is worth noticing the difference.",
        "A humane machine would tell you when to put it down. It would treat your time as something to be protected rather than harvested. A few designers are starting to build this way — interfaces with edges, software that knows when to end.",
        "In the meantime, the responsibility sits with us, unevenly and unfairly. Small acts of resistance help: turning off badges, leaving the phone in another room, choosing tools that respect a stopping point instead of engineering an infinite scroll.",
        "The goal isn't to reject technology — that ship sailed generations ago. It's to insist that the tools serve the texture of an actual life, one with mornings that don't begin in a feed and evenings that end somewhere other than a screen."
      ]
    },
    'blue-permission-slip': {
      title: 'A small blue permission slip', category: 'Space', tagClass: 'violet',
      author: 'Alma Kent', date: 'May 29, 2026', readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Astronauts describe a moment, usually a few days into orbit, when the sight of Earth stops being spectacular and starts being personal. They call it the overview effect — a shift in perspective that makes borders look invented and worries look small.",
        "You don't need a rocket to borrow a little of that feeling. Sometimes a photograph is enough: the whole planet, seas and storms and all seven billion of us, fitting inside a single blue marble with room to spare.",
        "From that distance, the argument you're still replaying in your head loses most of its weight. So does the deadline, the comment someone made, the mistake you're circling back to for the fourth time today. None of it disappears. It just gets sized correctly.",
        "Call this a small blue permission slip: permission to let some things be exactly as small as they actually are. Not everything deserves the volume we give it.",
        "The sky doesn't ask you to shrink your life. It just offers, occasionally, a reminder of scale — and scale, it turns out, is one of the kindest gifts a view can give a worried mind."
      ]
    },
    'weight-of-quiet-rooms': {
      title: 'The weight of quiet rooms', category: 'Philosophy', tagClass: '',
      author: 'Noor Iqbal', date: 'June 20, 2026', readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Silence has a weight, even though it has no mass. Anyone who has sat in an empty house after years of noise knows this. The quiet doesn't feel like absence — it feels like presence of a different kind, something settling into the space that voices used to fill.",
        "We are taught to fear quiet rooms, to fill them quickly with music, notifications, small talk. But a quiet room is also where thinking becomes possible again, where a half-formed idea finally gets enough space to finish forming.",
        "Philosophers have long suspected that most of our discomfort with stillness is really discomfort with ourselves — the parts we've been too busy to sit with. The room isn't heavy. We are, and the quiet simply lets us feel it.",
        "There's a kind of courage in staying in the quiet room a little longer than is comfortable, in resisting the urge to reach for a device the second boredom appears. That extra minute is often where the good thoughts live.",
        "Not every silence needs to be broken. Some of them are doing exactly what they're supposed to."
      ]
    },
    'language-of-tide-pools': {
      title: 'The language of tide pools', category: 'Nature', tagClass: '',
      author: 'Mira Sol', date: 'June 15, 2026', readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "A tide pool is a small, complete world that only exists twice a day. For a few hours it teems — anemones, hermit crabs, tiny darting fish — and then the tide comes back and erases the boundary that made it feel separate at all.",
        "There's something instructive in a world that knows it's temporary and thrives anyway. The anemone doesn't wait for permanence to open its arms. It does its work in the window it's given.",
        "Watching a tide pool teaches patience in a way that few other landscapes do. Nothing happens quickly. You have to crouch, wait, let your eyes adjust to a scale of life that operates in centimeters and minutes rather than miles and years.",
        "Most of what matters in a tide pool is easy to miss if you're moving at the pace of the rest of the beach. The same is often true of the rest of life.",
        "So the next time the tide is out, take the slower path along the rocks. Let a small, temporary world show you what it means to live fully inside a limited amount of time."
      ]
    },
    'ghosts-in-the-machine': {
      title: 'Ghosts in the machine', category: 'Technology', tagClass: 'cyan',
      author: 'Theo Marsh', date: 'June 10, 2026', readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Old code has a way of outliving the people who wrote it. Somewhere, right now, a decision made by a programmer decades ago is quietly running inside a system nobody fully understands, held together by comments nobody reads.",
        "We like to think of software as clean and rational, but most systems are closer to sediment — layer after layer of quick fixes, deadlines, and reasonable-at-the-time decisions, compressed into something that works, mostly, for reasons that are no longer entirely clear.",
        "There is a kind of humility that comes from maintaining old systems. You learn that most software isn't broken by malice, but by time — by requirements that shifted while the code stayed still.",
        "Every large piece of software is haunted a little, by choices made under different constraints, for different assumptions, in a world that has since moved on. Respecting that history, instead of resenting it, tends to produce better engineers.",
        "The machine remembers what we've forgotten. Sometimes the most useful skill in technology isn't building the new thing — it's listening carefully to what the old thing is still trying to tell you."
      ]
    },
    'art-of-enough': {
      title: 'The art of enough', category: 'Survival', tagClass: '',
      author: 'Elias Ward', date: 'June 06, 2026', readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1476611317561-60117649dd94?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Survival, at its core, is not about excess. It's about precisely enough — enough warmth, enough water, enough calories to keep moving until the next resource appears. Out in the wild, more is often just extra weight.",
        "There's a lesson in that most of us never apply to ordinary life, where more is treated as an unquestioned virtue. More hours, more possessions, more commitments — all carried like supplies we never asked whether we actually needed.",
        "People who spend real time outdoors tend to develop a sharper sense for the difference between want and need, simply because carrying the wrong answer on your back for ten miles is an excellent teacher.",
        "Enough is not a compromise. It is its own kind of skill — knowing exactly what a situation requires and declining to carry anything beyond it.",
        "Maybe the art of enough is the most transferable survival skill there is: the discipline to ask, before adding one more thing to the pack, whether it will actually help you get where you're going."
      ]
    },
    'letters-to-a-dead-star': {
      title: 'Letters to a dead star', category: 'Space', tagClass: 'violet',
      author: 'Alma Kent', date: 'June 02, 2026', readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Some of the light reaching your eyes tonight left its source before you were born. A few of those stars, if you could travel there today, wouldn't exist anymore — only the light survives, still arriving, still faithfully making the trip.",
        "There's something quietly moving about that delay. We are, in a very literal sense, always looking into the past when we look up. The night sky is less a photograph of what is and more an archive of what was.",
        "It raises an odd, tender question: what does it mean to be loyal to something that's already gone, simply because its message hasn't finished arriving yet? Grief, in a way, works on a similar delay.",
        "Maybe that's why old light feels less like astronomy and more like correspondence — a letter sent a long time ago, still finding its reader, still worth answering even after the sender is gone.",
        "Write back anyway. Some of the most important messages in a life arrive exactly like starlight: late, quiet, and only visible if you stop moving long enough to notice them."
      ]
    },
    'the-unlearning': {
      title: 'The unlearning', category: 'Psychology', tagClass: '',
      author: 'Noor Iqbal', date: 'May 30, 2026', readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1499728603263-13726abce5fd?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "We spend the first half of life learning things, and — if we're paying attention — the second half quietly unlearning a surprising number of them. Certainty about who we are turns out to be one of the more fragile things we carry.",
        "Unlearning gets a bad reputation. It sounds like failure, like walking something back. But most growth requires it: releasing an old story about yourself that was useful once and has since become a cage.",
        "The habits that protected you at nineteen are rarely the ones that serve you at thirty-nine. The trouble is that habits don't come with expiration dates. You have to notice, on your own, when one has quietly gone stale.",
        "There's a particular kind of relief in finally setting down a belief you've outgrown — the same relief as putting down a heavy bag you forgot you were still carrying.",
        "Unlearning isn't the opposite of growth. In a life honestly lived, it might be one of the clearest signs of it."
      ]
    },
    'slow-trail': {
      title: 'The slow trail', category: 'Adventure', tagClass: '',
      author: 'Elias Ward', date: 'May 26, 2026', readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "There is a version of every hike where you rush to the summit, take the photo, and rush back down. And there is a slower version, where the summit is simply one point among many worth noticing along the way.",
        "The slow trail isn't about pace so much as attention. It's the difference between walking through a landscape and walking with it — noticing where the light changes, where the trees thin, where the sound of water first becomes audible.",
        "Most of the truly memorable moments outdoors happen in the margins: an unplanned rest, a wrong turn, a conversation that only surfaces because there's nothing else demanding your focus.",
        "Speed has its uses. But it also has a cost, and the cost is usually paid in the details you didn't have time to see.",
        "Next time, try the slow trail — not because it's better, but because it will show you a version of the same mountain you've never met before."
      ]
    },
    'theory-of-small-things': {
      title: 'A theory of small things', category: 'Science', tagClass: 'cyan',
      author: 'Mira Sol', date: 'May 22, 2026', readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Under a microscope, the ordinary stops being ordinary. A drop of pond water becomes a crowded city. A grain of salt becomes an architecture. Scale is doing all the work — the thing itself hasn't changed, only how closely we're willing to look.",
        "Science, at its best, is a discipline of closer looking. Most of its biggest discoveries came from someone refusing to accept that a small, unglamorous thing wasn't worth a second glance.",
        "There's a humility built into working at small scales. You can't bluff your way through a cell culture or a crystal lattice. The small things insist on being taken seriously, on their own terms, at their own resolution.",
        "It's tempting to save our attention for what looks impressive from a distance. But the small things, examined closely enough, tend to reveal the same complexity we usually reserve for galaxies.",
        "Perhaps the real theory of small things is this: nothing is actually small. It only looks that way from too far away."
      ]
    },
    'keeping-a-window-open': {
      title: 'Keeping a window open', category: 'Wonder', tagClass: 'violet',
      author: 'Theo Marsh', date: 'May 18, 2026', readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=82',
      paragraphs: [
        "Wonder doesn't ask for much. Usually just an open window, a change in weather, or a few unclaimed minutes where nothing in particular is expected of you.",
        "Adults tend to lose access to it not because the world stops being wondrous, but because we stop leaving room for it. Every hour gets a purpose, and wonder, stubbornly, refuses to be purposeful.",
        "Children are better at this mostly because their schedules are worse — full of the kind of unstructured time that makes room for staring at ants, or clouds, or the strange fact that mirrors exist at all.",
        "You don't need to manufacture awe. You mostly need to stop scheduling it out of your life, and let a little unclaimed time back in.",
        "Keep a window open, literally or otherwise. Wonder tends to come in on its own, if you simply leave the latch undone."
      ]
    }
  };

  // "Fresh from the notebook" pieces reuse the same reader.
  Object.assign(STORIES, {
    'almost-wild': { title: 'In praise of the almost-wild', category: 'Nature', tagClass: '', author: 'Mira Sol', date: 'May 24, 2026', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "There's a particular kind of landscape that never makes the postcards: not untouched wilderness, not a manicured park, but the scrappy in-between — a vacant lot gone to weeds, a drainage ditch full of frogs, a strip of trees behind a parking lot.",
      "We tend to reserve our reverence for the dramatic and pristine, and overlook the almost-wild places doing quiet ecological work right at the edges of our ordinary lives.",
      "A weedy lot can host more birds in a season than a manicured garden ever will. It doesn't ask for admiration. It just keeps going, indifferent to whether anyone notices.",
      "There's something to learn from places that thrive without permission, in the margins nobody planned for.",
      "Next time you pass one, give it a second look. The almost-wild is doing more than it gets credit for."
    ]},
    'how-dark-is-dark': { title: 'How dark is the dark?', category: 'Space', tagClass: 'violet', author: 'Elias Ward', date: 'May 19, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7453?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Most of us have never actually seen a dark sky. Light pollution has crept so far into the atmosphere that a truly black night, thick with stars, has become something you have to travel for.",
      "The first time you see one, it's disorienting — the sky looks almost too full, too busy, as if someone had been quietly hiding most of the universe from you your whole life.",
      "Darkness, it turns out, isn't empty. It's a precondition. Without it, there's no contrast, and without contrast, no stars visible at all — just the washed-out orange glow most of us call night.",
      "There's a quiet argument here for protecting the dark itself, not just the light. Some things can only be seen in its absence.",
      "Find a dark sky if you can. It will recalibrate what you thought the word 'night' meant."
    ]},
    'room-inside-mind': { title: 'The room inside the mind', category: 'Psychology', tagClass: '', author: 'Alma Kent', date: 'May 16, 2026', readTime: '7 min read', image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Imagine your mind has a room nobody else can enter — no windows, no shared furniture, just you and whatever you've stored there over the years.",
      "Some people keep that room tidy, visiting often, sorting through what's inside. Others avoid it entirely, letting things pile up until the door barely opens.",
      "Therapy, at its best, is a bit like being handed a flashlight for that room — someone helping you see what's actually in there, rather than what you've assumed for years.",
      "The room doesn't go away if you avoid it. It just gets fuller, and harder to navigate when you finally do go looking for something specific.",
      "Visit the room on purpose sometimes. It's easier to keep in order than to excavate."
    ]},
    'patient-light': { title: 'We are made of a patient light', category: 'Science', tagClass: 'cyan', author: 'Mira Sol', date: 'May 09, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Every heavy element in your body — the calcium in your bones, the iron in your blood — was forged inside a star that no longer exists. You are, quite literally, made of old starlight that took its time getting here.",
      "It's one of those facts that sounds poetic until you realize it's just physics: stars fuse light elements into heavier ones, and when they die, they scatter that material across space, patiently, over billions of years.",
      "That patience is worth sitting with. Nothing about your existence was rushed. It took an almost unreasonable amount of cosmic time to assemble the ingredients.",
      "There's a strange comfort in being, at the atomic level, evidence of patience rewarded.",
      "You are not separate from the universe's slow work. You are one of its more recent results."
    ]},
    'pack-lightly': { title: 'Pack lightly for the unknown', category: 'Adventure', tagClass: '', author: 'Elias Ward', date: 'May 02, 2026', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Every experienced traveler eventually learns the same lesson the hard way: the bag always gets lighter with each trip, not heavier. Experience teaches you what you actually use.",
      "Most of what we pack for the unknown is really packed for anxiety — the 'just in case' items that exist to manage worry rather than to serve an actual need.",
      "Packing lightly requires a kind of trust: trust that you can improvise, trust that most problems have a solution you haven't thought of yet, trust that you won't need everything you're afraid of needing.",
      "The lighter the bag, the more room there is for whatever the trip actually turns out to require.",
      "Pack for the trip you're likely to have, not the one you're afraid of. The unknown rewards travelers who leave room for it."
    ]}
  });

  Object.assign(STORIES, {
    'art-of-arriving-late': { title: 'The art of arriving late', category: 'Philosophy', tagClass: '', author: 'Noor Iqbal', date: 'April 27, 2026', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Punctuality is a modern virtue, but arrival, in the deeper sense, has never run on a schedule. Understanding rarely shows up exactly when you need it. It tends to arrive fashionably late, after the moment that required it has already passed.",
      "This used to feel like failure — realizing the right thing to say a day after the conversation ended, understanding a decision only once its consequences had already landed. But lateness isn't the same as uselessness.",
      "Late understanding still changes how you carry the next version of the same situation. It just does its work retroactively, reshaping the story instead of the moment.",
      "Some lessons simply need the distance of hindsight to become visible at all. Arriving late doesn't disqualify them.",
      "So make peace with the delay. The insight that shows up after the party is often the one that stays for good."
    ]},
    'small-gods-of-habit': { title: 'Small gods of habit', category: 'Psychology', tagClass: '', author: 'Theo Marsh', date: 'April 20, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1499728603263-13726abce5fd?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "We like to think our days are shaped by decisions. Mostly, they're shaped by habits — small, automatic rituals that run quietly in the background, making a hundred choices before breakfast that never feel like choices at all.",
      "There's a reason the same cup gets used every morning, the same route gets walked without thought. Habit isn't laziness. It's the mind conserving energy for the decisions that actually deserve it.",
      "The trouble comes when a habit outlives its usefulness and keeps running anyway, on autopilot, long after the reason for it disappeared.",
      "Changing a habit rarely works through willpower alone. It usually needs a new ritual to replace the old one — habits, it turns out, don't like a vacuum.",
      "Treat your habits with a little reverence. They are quietly running most of your life, whether you're paying attention to them or not."
    ]},
    'forecast-for-wonder': { title: 'The forecast for wonder', category: 'Nature', tagClass: '', author: 'Mira Sol', date: 'April 14, 2026', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "There's no app for this, but there should be: a forecast for wonder, predicting the days when the sky will do something worth stepping outside for.",
      "Storm clouds, in particular, seem to carry more drama than any other kind of weather. There's a reason painters return to them again and again — light fighting through darkness rarely photographs as well as it feels in person.",
      "Weather asks for nothing from us except attention, and rewards that attention generously, on a schedule entirely its own.",
      "Most people check the forecast to plan around the weather. It might be worth checking it, occasionally, to plan toward it instead — to catch the hour when the light does something unrepeatable.",
      "Wonder has a forecast. It's just rarely the one we're checking."
    ]},
    'static-and-signal': { title: 'Static and signal', category: 'Technology', tagClass: 'cyan', author: 'Theo Marsh', date: 'April 08, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Before every clear signal, there's static — the noisy, in-between sound of a radio searching for the right frequency. It's easy to forget that clarity is usually built on top of a lot of noise, not the absence of it.",
      "The same is true of most creative and technical work. The first draft, the first prototype, is mostly static. The signal only emerges after enough tuning.",
      "It's tempting to judge early attempts by how far they are from the final version. But static isn't a mistake in the process — it's the process, doing exactly what it's supposed to do.",
      "Every clear frequency was once noise that someone was patient enough to keep adjusting.",
      "So let the static run its course. Somewhere underneath it, the signal is already there, waiting for the dial to find it."
    ]},
    'weather-of-memory': { title: 'The weather of memory', category: 'Wonder', tagClass: 'violet', author: 'Alma Kent', date: 'April 02, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Memory doesn't behave like a filing cabinet. It behaves more like weather — sudden, atmospheric, arriving without warning and passing through whether or not you were ready for it.",
      "A smell can bring back a whole decade. A particular slant of afternoon light can put you back in a room that no longer exists. There's no controlling when the front will move in.",
      "We tend to want memory to be orderly, searchable, obedient. It rarely is. It follows its own patterns, shaped by things we can't always predict or explain.",
      "Maybe the right response to a sudden memory isn't to interrogate why it arrived, but simply to let it pass through, the way you'd let weather pass through — noticing it, respecting it, and trusting that clearer skies will follow.",
      "The forecast for memory will never be reliable. That unpredictability might be exactly what keeps it honest."
    ]},
    'field-guide-restlessness': { title: 'A field guide to restlessness', category: 'Adventure', tagClass: '', author: 'Elias Ward', date: 'March 27, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Restlessness gets treated like a flaw to be managed, but for a certain kind of person, it's closer to an instrument — a signal pointing toward a trail that hasn't been walked yet.",
      "Not every itch to move needs curing. Sometimes it just needs a destination. The restlessness that shows up on a Tuesday afternoon is often just a map with nowhere yet to point.",
      "Long-distance walkers describe a moment, usually a few days in, when the restlessness stops being an itch and starts being fuel. The same energy, redirected, does very different work.",
      "The trick isn't eliminating restlessness. It's learning to recognize it early enough to point it somewhere worth going.",
      "So the next time it shows up uninvited, try treating it less like a problem and more like a compass that's simply waiting for a direction."
    ]},
    'mathematics-of-goodbye': { title: 'The mathematics of goodbye', category: 'Philosophy', tagClass: '', author: 'Noor Iqbal', date: 'March 20, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "There is no equation for how much a goodbye should hurt. It doesn't scale neatly with how long something lasted — a short chapter can leave a longer ache than a long one, and no formula predicts which will be which.",
      "We keep looking for the logic anyway, trying to justify the size of our grief against the size of what was lost, as if feeling too much or too little were a miscalculation to correct.",
      "Grief resists arithmetic. It has its own units, and they rarely translate cleanly into anyone else's.",
      "Maybe the only honest mathematics of goodbye is this: it costs exactly what it costs, and the bill doesn't need to be justified to anyone, including yourself.",
      "Let the goodbye be as large or as small as it actually is. There's no formula waiting to check your work."
    ]},
    'under-a-borrowed-sky': { title: 'Under a borrowed sky', category: 'Space', tagClass: 'violet', author: 'Alma Kent', date: 'March 14, 2026', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1454789476662-53eb23ba5907?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "None of us own the sky, and yet every culture that has ever looked up has claimed a version of it — named its patterns, told stories with its stars, borrowed it for a while and called it home.",
      "There's something generous about a sky that belongs to no one and everyone at once. Two people standing in different countries can look up at the same night and see completely different constellations of meaning.",
      "It's one of the few things left that hasn't been fully mapped, fenced, or monetized — a genuinely shared inheritance, indifferent to the borders we've drawn beneath it.",
      "Borrowing the sky, even for a few minutes a night, is a small reminder that some things are still held in common.",
      "Look up when you can. It's one of the last views that truly belongs to everyone."
    ]},
    'unfinished-museum': { title: 'The unfinished museum', category: 'Wonder', tagClass: 'violet', author: 'Theo Marsh', date: 'March 08, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Imagine a museum with empty rooms left deliberately unfinished — space reserved not for what's already known, but for whatever hasn't been discovered yet.",
      "Most institutions are built to display certainty: this happened, this is true, this is settled. Rarely do we build anything to honor the things we don't yet understand.",
      "A life, examined closely, looks more like this unfinished museum than a completed one. Whole wings are still under construction. Some exhibits will never be finished at all.",
      "There's a temptation to feel behind because of the empty rooms, as if they represent failure rather than simply unclaimed potential.",
      "Let a few rooms stay unfinished. That's not incompleteness — it's just what an honest, ongoing life actually looks like from the inside."
    ]},
    'small-mercies': { title: 'Small mercies', category: 'Survival', tagClass: '', author: 'Elias Ward', date: 'March 02, 2026', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1476611317561-60117649dd94?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Out in difficult conditions, gratitude gets recalibrated fast. Dry socks become a genuine event. A warm meal becomes something close to luxury. The bar for what counts as a mercy drops until almost everything qualifies.",
      "It's tempting to think this recalibration only works under real hardship, but it travels surprisingly well back into ordinary life, if you let it.",
      "A functioning roof. A full pantry. A body that, on most days, simply works without complaint. These are small mercies that are easy to stop noticing once they're guaranteed.",
      "Survival has a way of restoring proportion — reminding you which comforts are actually foundational and which were just decoration.",
      "You don't need difficult conditions to practice this. You just need to look, occasionally, at what's already been provided, and let it count as the mercy it actually is."
    ]},
    'quiet-experiment': { title: 'The quiet experiment', category: 'Science', tagClass: 'cyan', author: 'Mira Sol', date: 'February 24, 2026', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=82', paragraphs: [
      "Most breakthroughs aren't loud. They happen quietly, in labs that look nothing like the dramatic ones in films — fluorescent light, careful notes, the same experiment run one more time to make sure it wasn't a fluke.",
      "Science rewards patience more than genius. The quiet, unglamorous repetition — testing, adjusting, testing again — is where almost all real progress actually happens.",
      "There's a lesson in this for anyone working on something that isn't producing visible results yet: the absence of drama isn't the absence of progress.",
      "The quiet experiment, run carefully enough times, eventually produces the loud result. But it rarely announces itself while it's still quiet.",
      "Keep running the quiet version. That's usually what the loud breakthroughs were made of all along."
    ]}
  });

  const POEMS = [
    { title: 'Doorways', author: 'Mira Sol', body: "There is a door in every hour.\nThere is a sky beneath every skin.\nBe still enough\nto find them.\n\nNot every threshold announces itself —\nsome open only\nwhen you stop\nknocking." },
    { title: 'Salt and Light', author: 'Elias Ward', body: "The sea keeps what it's given\nand gives it back changed —\nsalt for softness,\nlight for the dark you carried in.\n\nI have learned to trade this way too:\nhand over the heavy thing,\nwalk back lighter,\nsalt-rimmed, unbothered." },
    { title: 'What the Moon Keeps', author: 'Alma Kent', body: "The moon keeps no secrets,\nonly distance —\nthe same face, always turned,\nnever quite arriving.\n\nI used to think that was loneliness.\nNow I think it might be devotion:\nto stay exactly this close,\nfor this long, without ever landing." },
    { title: 'Unfinished', author: 'Theo Marsh', body: "Leave the sentence open.\nLeave the paint half-dry.\nSome things were never meant\nto reach a final line.\n\nI am learning to sign my name\nunderneath the incomplete —\nnot as failure,\nbut as proof I was still working." },
    { title: 'Low Tide', author: 'Mira Sol', body: "Everything the sea forgot\nis lying here, uncovered —\nshells, glass, a shoe,\nthe shape of what left in a hurry.\n\nLow tide is just honesty\nwith the water pulled back.\nI could use\nan hour like that." },
    { title: 'Night Shift', author: 'Noor Iqbal', body: "Somewhere a light stays on for you\nwhile the rest of the street sleeps —\na kettle, a window,\na version of care that keeps no hours.\n\nI want to be that light for someone.\nI want someone to be it for me.\nEither way,\nthe waiting isn't wasted." },
    { title: 'The Weight of Wings', author: 'Elias Ward', body: "Nothing that flies\ncarries more than it needs.\nHollow bones,\na body built for leaving.\n\nI keep packing my life\nlike I'm afraid of takeoff —\nas if the weight itself\nwere proof that I'm staying." },
    { title: 'Static', author: 'Theo Marsh', body: "Somewhere between the stations\nis where I live most days —\nnot quite tuned,\nnot quite lost either.\n\nCall it searching, not failing.\nThe signal is out there.\nI just haven't\nfound the frequency yet." },
    { title: 'Small Prayers', author: 'Alma Kent', body: "Let the kettle boil in time.\nLet the message arrive gently.\nLet today be\nordinary, and enough.\n\nI don't pray for miracles anymore.\nJust the small mercies —\nthe ones that fit\ninside a single Tuesday." },
    { title: 'Everything Arrives Late', author: 'Noor Iqbal', body: "The apology, the understanding,\nthe letter you meant to send —\nall of it arrives\nafter the moment that needed it.\n\nAnd still I keep the door unlocked.\nLate is not the same as never.\nI have learned to leave\nthe porch light on regardless." },
    { title: 'Winter Light', author: 'Mira Sol', body: "Even the sun goes gently here,\nlow and unhurried,\nas if it too\nis conserving what it has left.\n\nI want to learn this from the winter:\nhow to give less\nand still call it\nenough light to live by." },
    { title: 'The Space Between', author: 'Theo Marsh', body: "It's not the notes that make the song —\nit's the silence holding them apart.\nWithout the pause,\nnothing would ever land.\n\nI'm trying to trust the gaps in my own life\nthe way a song trusts its rests:\nnot empty,\njust waiting for the next note to matter." },
    { title: 'Still Here', author: 'Alma Kent', body: "After the storm, the field\ndidn't apologize for surviving —\nit just stood there,\nbent, green, unimpressed by the weather.\n\nSome mornings that's the whole poem:\nstill here,\nstill standing,\nnothing more required of the grass." }
  ];

  const readerModal = $('#readerModal'), readerContent = $('#readerContent');
  const essaysModal = $('#essaysModal'), essaysGrid = $('#essaysGrid');
  const poetryModal = $('#poetryModal'), poemList = $('#poemList');
  let lastFocused = null;

  function lockScroll(lock) { document.documentElement.style.overflow = lock ? 'hidden' : ''; }

  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    const closeBtn = $('.modal-close', modal);
    if (closeBtn) closeBtn.focus();
  }
  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    if (lastFocused) lastFocused.focus();
  }

  function openReader(id) {
    const story = STORIES[id];
    if (!story) return;
    readerContent.innerHTML = `
      <img class="reader-image" src="${story.image}" alt="${story.title}">
      <div class="meta"><span class="tag${story.tagClass ? ' ' + story.tagClass : ''}">${story.category}</span></div>
      <h2>${story.title}</h2>
      <span class="byline">By ${story.author} · ${story.date} · ${story.readTime}</span>
      ${story.paragraphs.map(p => `<p>${p}</p>`).join('')}
    `;
    openModal(readerModal);
    readerContent.scrollTop = 0;
  }

  // Every card/link that carries data-story opens the reader.
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-story]');
    if (trigger) {
      event.preventDefault();
      openReader(trigger.dataset.story);
    }
  });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-story]')) {
      event.preventDefault();
      openReader(event.target.dataset.story);
    }
  });

  $('#readerClose').addEventListener('click', () => closeModal(readerModal));
  readerModal.addEventListener('click', event => { if (event.target === readerModal) closeModal(readerModal); });

  // "View all essays" — renders the 9 additional threads into a gallery grid.
  const EXTRA_ESSAY_IDS = ['weight-of-quiet-rooms', 'language-of-tide-pools', 'ghosts-in-the-machine', 'art-of-enough', 'letters-to-a-dead-star', 'the-unlearning', 'slow-trail', 'theory-of-small-things', 'keeping-a-window-open'];
  function renderEssaysGrid() {
    if (essaysGrid.childElementCount) return;
    essaysGrid.innerHTML = EXTRA_ESSAY_IDS.map(id => {
      const s = STORIES[id];
      return `
        <article class="story-card js-read" data-story="${id}" role="button" tabindex="0" aria-label="Read: ${s.title}">
          <div class="image-wrap">
            <img loading="lazy" src="${s.image}" alt="${s.title}"><span class="tag${s.tagClass ? ' ' + s.tagClass : ''}">${s.category}</span>
          </div>
          <div class="story-body">
            <div class="meta"><span>${s.date}</span><span>${s.readTime}</span></div>
            <h3>${s.title}</h3>
            <p>By ${s.author}</p>
            <a href="javascript:void(0)" class="read-more">Read story <b>↗</b></a>
          </div>
        </article>`;
    }).join('');
  }
  $('#viewAllEssays').addEventListener('click', () => { renderEssaysGrid(); openModal(essaysModal); });
  $('#essaysClose').addEventListener('click', () => closeModal(essaysModal));
  essaysModal.addEventListener('click', event => { if (event.target === essaysModal) closeModal(essaysModal); });

  // "Enter the archive" — renders all 13 poems.
  function renderPoemList() {
    if (poemList.childElementCount) return;
    poemList.innerHTML = POEMS.map(poem => `
      <div class="poem-item">
        <h3>${poem.title}</h3>
        <span class="byline">${poem.author}</span>
        <p>${poem.body}</p>
      </div>`).join('');
  }
  $('#enterArchive').addEventListener('click', () => { renderPoemList(); openModal(poetryModal); });
  $('#poetryClose').addEventListener('click', () => closeModal(poetryModal));
  poetryModal.addEventListener('click', event => { if (event.target === poetryModal) closeModal(poetryModal); });

  // Escape closes whichever modal is open.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    [readerModal, essaysModal, poetryModal].forEach(modal => { if (modal.classList.contains('open')) closeModal(modal); });
  });
})();
