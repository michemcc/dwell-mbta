import React, { useState, useEffect } from 'react'
import { MonoLabel } from './Primitives'

const SITE_URL = 'https://dwellmbta.com'

const AUTHOR = {
  name:  'Michael M',
  alias: 'mich',
  bio:   'I have been commuting the Newburyport line from Salem into North Station since 2022. I built DWELL because I was tired of opening five different apps just to know if my train was running. These guides are the things I wished someone had told me when I first moved to the area.',
  url:   `${SITE_URL}/guides`,
}

const ARTICLES = [
  {
    id:       'mbta-commuter-rail-guide',
    slug:     'mbta-commuter-rail-guide',
    title:    'The Complete MBTA Commuter Rail Guide for 2025',
    subtitle: 'Every line, every zone, and what I learned the hard way',
    date:     '2025-03-12',
    dateDisplay: 'March 12, 2025',
    readMins: 9,
    tags:     ['Commuter Rail', 'Getting Around', 'Beginner'],
    intro:    "I have been commuting from Salem to North Station on the Newburyport line since 2022, and I figured out most of it by trial and error. Missed trains, wrong platforms, surprise fares on my first week. This is the guide I needed then. Boston's commuter rail is genuinely one of the best ways to get around the region, but the learning curve is steeper than it should be.",
    content: [
      {
        heading: 'What the Commuter Rail Actually Is',
        body: `Think of it as a completely separate transit network that happens to be run by the same agency as the T. Twelve lines, 145 stations, stretching from Providence in the south to Newburyport in the north and Fitchburg to the west. Two downtown hubs: North Station for anything north or northwest of the city, and South Station for south and southwest.

The key thing that tripped me up at first: these trains run on a schedule, not continuously. You cannot just show up and wait three minutes like you would at Park Street. During peak hours on busy lines you might get a train every 30 minutes. On less-traveled routes or off-peak hours, you could be waiting an hour or more. Check the schedule before you leave. DWELL shows live departures for every station.`,
      },
      {
        heading: 'Zones and What You Will Pay',
        body: `Fares are distance-based across zones labeled 1A through 10. Zone 1A is the innermost ring, covering stops like Back Bay, Ruggles, Forest Hills, and Hyde Park, and costs the same $2.40 as a subway ride. Zone 10 out to Providence costs about $12.75 for a single trip.

I pay for a monthly pass, which has saved me a lot over buying individual tickets. You can pay on the train with cash, contactless card, or the MBTA app. One thing to know: if you get on at a staffed station without a valid ticket, conductors can charge a surcharge. I have seen this happen to confused tourists more than once. Buy your ticket before boarding if you can.`,
      },
      {
        heading: 'North Station Lines',
        body: `The Haverhill Line is the one I know best. It heads north through Reading, Lawrence, and Bradford to Haverhill. Reading has good parking and decent frequency during rush hour, which is why so many people commute from there.

The Newburyport/Rockport Line runs along the North Shore through Salem, Beverly, Gloucester, and ends at either Newburyport or Rockport depending on the train. Salem is always packed, especially in October when the whole city turns into a Halloween destination.

The Lowell Line serves Woburn and Wilmington and connects to the Red Line at Alewife via shuttle bus, which is a useful option a lot of people do not know about.

The Fitchburg Line heads west through Waltham and Concord to Fitchburg. Waltham is the busiest stop by a wide margin.`,
      },
      {
        heading: 'South Station Lines',
        body: `The Framingham/Worcester Line is one of the most heavily used. It runs west through Natick and Framingham to Worcester, and the express trains are genuinely fast at around 75 minutes end to end.

The Providence/Stoughton Line is worth calling out because it connects to actual Amtrak service at Providence. MBTA and Amtrak trains share the tracks but have separate fares and ticketing. Make sure you are on the right one.

The Franklin/Foxboro Line has event trains for Patriots and Revolution games at Gillette Stadium. This is the easiest way to get to a game without dealing with the parking situation.`,
      },
      {
        heading: 'Tips I Learned the Hard Way',
        body: `Get a CharlieCard. Load it with funds or your monthly pass. It works across the whole system, subway and bus included, and tapping in is much faster than anything else.

Sit in a car toward the middle of the train. On short consists, the cars near the ends sometimes do not line up with platform exits at North Station or South Station. I have wasted a few minutes at the wrong end of the platform.

The Quiet Car is typically the first car from the locomotive end. It is enforced by social pressure rather than formal policy, but most people respect it. I always sit there on the way home.

If you miss your train, do not panic. Check if an express bus or the subway covers part of your route as a fallback. The Orange Line, for example, parallels the commuter rail to some extent on the southern corridor.`,
      },
    ],
  },

  {
    id:       'mbta-transfers-guide',
    slug:     'mbta-transfers-guide',
    title:    'How to Transfer Between MBTA Lines Without Getting Lost',
    subtitle: 'Downtown Crossing, North Station, and every hub that matters',
    date:     '2025-02-28',
    dateDisplay: 'February 28, 2025',
    readMins: 7,
    tags:     ['Transfers', 'Subway', 'Navigation'],
    intro:    "The first time I tried to transfer from the Red Line to the Orange Line at Downtown Crossing I came out on the wrong street and walked three blocks in the wrong direction. The MBTA transfer system is actually pretty logical once someone explains it. Here is that explanation.",
    content: [
      {
        heading: 'Downtown Crossing: The Most Important Hub',
        body: `Downtown Crossing is where the Red Line and the Orange Line share a station, and it is the most useful transfer point in the whole system. You can switch between both lines without exiting and paying another fare.

The Red Line platforms are deeper underground. The Orange Line platforms are one level up. Signs inside the station are clear once you know what you are looking for. The Silver Line buses stop at the surface level above.

Downtown Crossing and Park Street are also connected by a short underground walkway, so in practice you can get between the Red, Orange, Green, and Silver lines all at this cluster of stations.`,
      },
      {
        heading: 'North Station: Where Rail Meets Rail',
        body: `North Station is my home base, so I know this one well. The commuter rail platforms are at street level inside TD Garden. The Orange Line and Green Line platforms are underground below the same building.

The walk between the commuter rail concourse and the subway entrance takes about three to four minutes at a normal pace. If you are making a tight connection, budget five minutes to be safe. I once missed my train home because I underestimated this walk during a Bruins game when the whole building was packed.

From downtown, the Orange Line gets you to North Station in two stops from Downtown Crossing and one stop from Haymarket.`,
      },
      {
        heading: 'South Station',
        body: `South Station mirrors North Station for the southern corridor. The Red Line runs underground directly below the main train hall. Follow the signs down to find it.

The Silver Line SL1 to Logan Airport also departs from South Station, from a lower level. This is the cheapest and often fastest way to reach Logan from the south side of the city.`,
      },
      {
        heading: 'Back Bay',
        body: `Back Bay is a stop most people overlook but it is genuinely useful. It sits on the Orange Line and is also served by commuter rail lines departing from South Station.

If you are heading to the Prudential Center, Copley, or the Back Bay neighborhood, getting off here and walking is often faster than continuing to South Station and coming back on the Green Line. I use this shortcut regularly when I am coming in from the commuter rail.`,
      },
      {
        heading: 'Government Center and State',
        body: `These two stops sit one apart on both the Blue and Green lines and together handle the most useful Blue Line connections.

State connects the Blue Line to the Orange Line. Government Center connects the Blue Line to the Green Line. So if you need to get from East Boston or Revere to the Red Line, your fastest path is Blue Line to State, then Orange Line to Downtown Crossing, then Red Line.

The walk between Government Center and Haymarket is also short enough that people sometimes walk it instead of taking one stop on the Green Line.`,
      },
      {
        heading: 'Park Street: Busiest Station in the System',
        body: `Park Street connects the Red Line to every Green Line branch. The Red Line platforms are the deepest. The Green Line platforms are at the mezzanine level above.

During morning rush hour the Green Line platforms at Park Street can get genuinely overwhelming. If you are heading outbound on the Green Line from the Red Line and the platform looks like a concert venue, try walking one stop along the surface to Boylston. It is quieter almost every time.`,
      },
    ],
  },

  {
    id:       'mbta-to-logan-airport',
    slug:     'mbta-to-logan-airport',
    title:    'Getting to Logan Airport on the MBTA: What Actually Works',
    subtitle: 'Silver Line, Blue Line, and when to just call an Uber',
    date:     '2025-03-05',
    dateDisplay: 'March 5, 2025',
    readMins: 6,
    tags:     ['Airport', 'Silver Line', 'Travel Tips'],
    intro:    "I have taken the Silver Line to Logan more times than I can count. I have also taken a cab when the Silver Line was not the right call. Here is an honest look at both options and how to know which one to use.",
    content: [
      {
        heading: 'The Silver Line SL1: Best from South Station',
        body: `The SL1 is the cleanest option if you are starting from South Station or anywhere on the Red Line. It runs underground from South Station, pops up at the Seaport, and goes directly into the airport tunnel stopping at Terminals A, B, and C. End to end is roughly 12 to 18 minutes depending on tunnel traffic.

The part that surprises most people: the SL1 is free in the outbound direction. You pay nothing to go from South Station to the airport. Coming back, you pay the standard $2.40 fare. I have no idea why it works this way but it does.

Check DWELL before you head down, especially in the morning when delays are more common.`,
      },
      {
        heading: 'Blue Line to Airport: Best from the North',
        body: `If you are coming from the Blue Line corridor or from the Orange Line via State Street, the Blue Line to Airport station is your route. At Airport station you pick up free shuttle buses that circulate to all terminals.

The shuttle run from Airport station to your terminal can take anywhere from 5 to 15 minutes depending on which terminal is first on the loop. Terminal E (international) is usually the last stop and takes the longest. I have started leaving an extra 15 minutes on international trips because of this.`,
      },
      {
        heading: 'If You Are Coming from the Commuter Rail',
        body: `Here is the path I take when I am flying out of Logan from the North Shore:

Take the commuter rail inbound to North Station. Take the Orange Line two stops south to State. Transfer to the Blue Line at State. Ride to Airport station. Take the free terminal shuttle.

Door to door from my house in Salem to the Delta terminal has been as fast as 55 minutes when everything connects. It has also taken 90 minutes when trains were delayed. I budget 75 minutes and have a backup plan for anything earlier than 7am.`,
      },
      {
        heading: 'When the T Is Not the Right Call',
        body: `I will be honest about this because too many guides oversell public transit to the airport. There are situations where a cab or rideshare is simply better.

If you have two large bags or anything that needs special handling, the Silver Line in particular can be genuinely uncomfortable during rush hour. I have done it with a 28-inch suitcase and it was fine on an off-peak Tuesday and miserable on a Friday afternoon.

If your flight leaves before 5:30am, the first SL1 from South Station runs around 5:25am and the Blue Line starts around 5:15am. Before that you need a cab or rideshare regardless.

If you are coming from the western suburbs on the Framingham line, the math sometimes works out better for a direct ride. Commuter rail to South Station, then Silver Line to the airport, adds at least 30 minutes to what would otherwise be a 25 minute cab ride from Natick.`,
      },
    ],
  },

  {
    id:       'boston-subway-line-guide',
    slug:     'boston-subway-line-guide',
    title:    'Boston Subway Lines Explained: Red, Orange, Green, Blue',
    subtitle: 'What each line covers and which one you actually need',
    date:     '2025-01-18',
    dateDisplay: 'January 18, 2025',
    readMins: 8,
    tags:     ['Subway', 'Beginner', 'Boston'],
    intro:    "When I first moved to Boston I looked at the MBTA map and felt mildly overwhelmed. Four colored lines, multiple branches, a Silver Line that is secretly a bus. Here is a plain-language breakdown of what each line does and who it is for.",
    content: [
      {
        heading: 'Red Line: The Backbone',
        body: `The Red Line is the most used line in the system and runs a north-south route through Cambridge and Boston. It starts at Alewife in northwest Cambridge, goes through Harvard, MIT, and Charles/MGH, crosses the river into Boston at Charles, and then hits Park Street and Downtown Crossing before splitting into two branches south of JFK/UMass.

The Braintree branch goes south through the Quincy neighborhoods to Braintree. The Ashmont branch serves Dorchester neighborhoods including Fields Corner and Savin Hill. Both branches are served by the same trains until JFK, where they split.

The stretch between Harvard and Downtown Crossing is brutal during rush hour. I have stood pressed against the door for the full trip more than once. The first and last cars are usually slightly less crowded than the middle cars.`,
      },
      {
        heading: 'Orange Line: North to South Through the Middle',
        body: `The Orange Line runs from Oak Grove in Malden straight down through the center of Boston to Forest Hills in Jamaica Plain. Key stops include North Station, Downtown Crossing, Back Bay, Ruggles, and Jackson Square.

It connects the two major commuter rail hubs, which makes it genuinely useful for anyone arriving from outside the city. The fleet was fully replaced with new cars a few years ago, so it is the smoothest ride in the system. I take it from North Station every day and it has been noticeably more reliable since the new cars came in.`,
      },
      {
        heading: 'Green Line: The Complicated One',
        body: `The Green Line is the oldest part of the system and the hardest to understand at first. It runs underground through downtown, comes up at Kenmore, and then splits into four branches heading west and southwest.

B branch goes to Boston College along Commonwealth Avenue, sharing the street with cars for much of the way. C branch goes to Cleveland Circle through Brookline. D branch runs on its own right-of-way out to Riverside in Newton, which makes it the fastest and most reliable of the four. E branch heads south to Heath Street, with a newer extension north through Fenway, Mission Park, and all the way to Medford/Tufts.

The surface sections are subject to traffic delays, which is why Green Line arrival times are harder to predict than other lines. I have found the D branch to be the most consistent by a significant margin.`,
      },
      {
        heading: 'Blue Line: East Boston and the Airport',
        body: `The Blue Line runs from Bowdoin in downtown under the harbor to East Boston and then north along the coast through Revere to Wonderland. It is the main transit lifeline for East Boston and Revere, and the only direct connection to Logan Airport.

The infrastructure here is the oldest in the system, dating back to 1904. You can feel it. The trains are shorter, the stations are tighter, and the whole thing has a certain vintage quality that I have come to appreciate. The airport connection via free shuttles from Airport station is what most non-residents use it for.`,
      },
      {
        heading: 'Silver Line: Bus Rapid Transit with a Brand',
        body: `The Silver Line is not a rail line. It is a network of buses that uses the same fare system and runs in dedicated lanes or tunnels in certain sections. There are three sub-routes: SL1 to Logan Airport, SL2 to the Seaport waterfront, and SL3 to Chelsea.

In the downtown core the buses run underground in a dedicated tunnel and feel like a subway. Once they surface in South Boston or head toward Chelsea they are in traffic like any other bus. The reliability drops noticeably on the surface sections.

The SL1 to the airport is free outbound from South Station, which is the main reason most visitors end up using it.`,
      },
      {
        heading: 'Fares and How to Pay',
        body: `Every subway line charges a flat $2.40 per ride. The CharlieCard is a reusable plastic card you load at station kiosks. It gives you the base fare with no surcharge. You can also tap a contactless credit or debit card directly at the turnstile.

Transfers between lines within the same paid zone are free as long as you do not exit the system. Monthly passes are available for around $90 and pay for themselves if you ride more than 38 times in a month.`,
      },
    ],
  },

  {
    id:       'mbta-tips-for-newcomers',
    slug:     'mbta-tips-for-newcomers',
    title:    'MBTA Tips for Boston Newcomers: What Nobody Tells You',
    subtitle: 'The unwritten rules, hidden shortcuts, and common mistakes',
    date:     '2025-04-10',
    dateDisplay: 'April 10, 2025',
    readMins: 7,
    tags:     ['Beginner', 'Tips', 'Getting Around'],
    intro:    "I have given the \"how to get around Boston\" talk to at least a dozen people who moved here for grad school or a new job. These are the things that aren't in the official guide — the stuff you only learn by riding the system for a few months or by having a local explain it to you.",
    content: [
      {
        heading: 'Get a CharlieCard, Not a CharlieTicket',
        body: `There are two kinds of fare media on the MBTA: the CharlieCard (hard plastic, reloadable, lasts indefinitely) and the CharlieTicket (paper, single-use or limited-use). The plastic CharlieCard gets you the base subway fare of $2.40. The paper ticket charges more for the same ride — I have seen $3.25 on some transactions.

You can pick up a free CharlieCard at the airport, at staffed station booths like Park Street, Downtown Crossing, and South Station, or at certain retail locations. Once you have one, load it at any station kiosk or online via the MBTA app. Tap it against the reader at turnstiles — do not insert it like an ATM card. That slot on the turnstile is for the old paper tickets only.`,
      },
      {
        heading: 'The Free Transfer Window',
        body: `When you tap your CharlieCard to board a bus, you get a two-hour window during which any further bus or subway rides cost nothing extra. This is a relatively recent policy change that most newcomers don't know about.

It means you can take a bus to the subway, ride the subway across the city, and transfer to another bus — all for one $2.40 base fare — as long as all of that happens within two hours of your first tap. The transfer window does not apply if you exit the paid zone between legs. Keep that in mind when you are connecting at a station where you have to exit and re-enter.`,
      },
      {
        heading: 'Park Street Is the Center of Everything',
        body: `Park Street station is where the Red Line and Green Line intersect at street level on the Boston Common. If you ever get turned around, make your way to Park Street and you can get anywhere in the system from there — Downtown Crossing is right below at the same hub, adding the Orange Line.

The neighborhood names in Boston are not always obvious from a map. Beacon Hill is a five-minute walk from Charles/MGH on the Red Line, not its own station. The Seaport District is served by the Silver Line SL2 from South Station. Fenway is on the Green Line D branch, not the C branch — a mistake I made my first week.`,
      },
      {
        heading: 'Service Gaps Are Real on Weekends',
        body: `On weekdays the MBTA runs frequently enough that you rarely wait more than 8 to 10 minutes for a subway train during peak hours. Weekends are different. Early Sunday mornings especially — trains can be 15 to 20 minutes apart, and certain commuter rail lines run only a handful of times all day.

The MBTA app and DWELL both show live wait times, so check before you leave rather than assuming you can just show up. Saturday evenings heading inbound are generally fine. Sunday mornings heading anywhere are when things get thin.`,
      },
      {
        heading: 'Accessibility Varies Enormously by Station',
        body: `The MBTA system has made significant investments in accessibility over the past decade but it is still uneven. Many older Green Line surface stops are not fully accessible. Certain stations, including some on the Red and Orange lines, have elevators that are frequently out of service.

If you or someone with you needs step-free access, check the MBTA's accessibility map before you go and have a backup route in mind. DWELL shows service alerts, which include elevator outages when reported. The MBTA's customer support line can also tell you the current status of elevators at specific stations.`,
      },
      {
        heading: 'Night Owl and Late Service',
        body: `The MBTA does not run all night. Last trains on most subway lines leave downtown stations around 12:30 to 1:00 AM on weekdays and slightly later on Friday and Saturday nights. If you miss the last train, your options are Uber, Lyft, or one of the overnight bus routes on select corridors.

The MBTA runs a limited number of late-night bus routes after the subway closes — check the website for current service. Rideshare prices surge significantly after bar close, so if you are heading home late it is worth checking the last train departure and leaving before it rather than relying on apps.`,
      },
      {
        heading: 'Standing Room Protocol',
        body: `Boston commuters have unwritten rules about packed trains. Move to the center of the car — do not cluster near the doors. The people near the doors are trying to exit at the next stop, and standing in their way while scrolling your phone is a major faux pas.

On escalators, stand on the right, walk on the left. This is enforced by social pressure and occasional pointed staring. At busy stations like Downtown Crossing and Park Street there are audible announcements reminding people of this. The rule is taken seriously.`,
      },
    ],
  },

  {
    id:       'mbta-charliecard-guide',
    slug:     'mbta-charliecard-guide',
    title:    'The Complete CharlieCard Guide: Fares, Passes, and Saving Money on the MBTA',
    subtitle: 'How to pay, which pass is worth it, and how to not overpay',
    date:     '2025-05-02',
    dateDisplay: 'May 2, 2025',
    readMins: 6,
    tags:     ['Fares', 'CharlieCard', 'Money'],
    intro:    "Fares on the MBTA are not complicated, but there are enough options that I have seen people pay significantly more than they needed to — or miss out on passes that would have paid for themselves in a week. Here is everything you need to know about how to pay on the T.",
    content: [
      {
        heading: 'How CharlieCard Fares Work',
        body: `The base subway fare in 2025 is $2.40 per ride when you use a CharlieCard. Bus rides are $1.70. The CharlieCard is a hard plastic card similar to a hotel key card. You load money onto it at any station kiosk or online, then tap it against the circular reader at turnstiles and bus fare boxes. The card never expires and your balance stays on it indefinitely.

The paper CharlieTicket — which you might get from a kiosk if you are buying a single ride — costs more for the same trips. Subway fare by ticket is $3.25 in many cases versus $2.40 by card. Getting the plastic card is not optional if you want to pay the right price.`,
      },
      {
        heading: 'Where to Get a CharlieCard',
        body: `Free CharlieCards are available at staffed MBTA information booths at Park Street, Downtown Crossing, North Station, South Station, Alewife, Forest Hills, Back Bay, and several other major stations. You can also get one at Logan Airport near the baggage claim areas.

Some kiosks at stations dispense them, though this can vary. If you are arriving in Boston for the first time, the easiest move is to tap a contactless credit card the first day — the tap rate is higher but you are not locked in — and then get a CharlieCard when you pass through a staffed station. You can transfer your remaining balance from a paper ticket to a CharlieCard at information booths.`,
      },
      {
        heading: 'Monthly Passes: Worth It If You Commute',
        body: `Monthly passes eliminate the per-ride cost and are worth it if you ride the subway more than about 38 times in a calendar month. A monthly LinkPass costs around $90 and covers unlimited subway, bus, and Silver Line rides for the full calendar month.

You can buy a monthly pass online through the MBTA website, at station kiosks, or through the MBTA mTicket app. If you have a commuter rail pass, different monthly rates apply based on your zone. Zone 1A, which covers the inner-most commuter rail stops like Back Bay and Ruggles, costs around $90 — same as the subway pass. Zone 10 out to Providence costs over $400 per month.

If your employer offers a commuter benefits program, check whether you can use pre-tax dollars to pay for your monthly pass. Federal law allows up to $315 per month (as of 2025) in pre-tax transit benefits, which can meaningfully reduce what you actually pay out of pocket.`,
      },
      {
        heading: 'The Two-Hour Transfer Rule',
        body: `A policy change introduced in recent years dramatically improved value for multi-modal riders: when you start a trip with a CharlieCard tap on bus or subway, you get a two-hour window in which subsequent rides on bus or subway cost nothing.

This means a commute that combines a bus ride, a subway leg, and another bus at the other end costs just one $2.40 base fare — not three separate charges. The transfer must happen within two hours of your first tap. The window resets each time you start a new trip after the previous two hours have elapsed.`,
      },
      {
        heading: 'Commuter Rail Fares Are Different',
        body: `Commuter rail uses a zone-based pricing system entirely separate from the subway. Fares range from $2.40 in Zone 1A (the closest stops) to over $12 for Zone 10 at Providence. Your CharlieCard can hold a commuter rail monthly pass, but a stored cash balance on the card generally cannot be used for commuter rail — you need to buy a commuter rail ticket separately at the station kiosk or on the MBTA app.

Conductors on commuter rail will check tickets. If you board at a staffed station and you are caught riding without a ticket, there is a surcharge added to the fare. This happened to someone I used to commute with because they forgot to top up the app before running to catch the train. Buy your ticket before boarding when you can.`,
      },
      {
        heading: 'Reduced Fare Programs',
        body: `Several groups qualify for reduced fares on the MBTA. Seniors aged 65 or older can get a Senior CharlieCard that cuts the subway fare to $1.10. Riders with disabilities that qualify under ADA provisions can apply for a reduced fare card as well. Youth aged 18 and under with a Youth CharlieCard pay $0.90 per ride.

Each of these requires an application and verification through the MBTA. The applications are available on the MBTA website and typically take a few weeks to process. If you are eligible, the savings add up quickly — the senior discount alone essentially cuts your monthly transit cost in half.`,
      },
    ],
  },
]

// ── Inject JSON-LD Article schema into document head ─────────────────────────
function injectArticleSchema(article) {
  const id = 'dwell-article-schema'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  const wordCount = article.content.reduce((sum, s) => sum + s.body.split(' ').length, 0)
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.subtitle,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'DWELL',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/guides/${article.slug}`,
    },
    image: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og-image.png`,
      width: 1200,
      height: 630,
    },
    keywords: article.tags.join(', '),
    articleSection: 'MBTA Transit Guides',
    wordCount,
    timeRequired: `PT${article.readMins}M`,
    about: {
      '@type': 'Thing',
      name: 'MBTA',
      sameAs: 'https://www.mbta.com/',
    },
  })

  // Inject BreadcrumbList for this article
  const breadId = 'dwell-breadcrumb-schema'
  let breadEl = document.getElementById(breadId)
  if (!breadEl) {
    breadEl = document.createElement('script')
    breadEl.id = breadId
    breadEl.type = 'application/ld+json'
    document.head.appendChild(breadEl)
  }
  breadEl.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'DWELL',  item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE_URL}/guides/${article.slug}` },
    ],
  })

  // Update meta description for this article
  let metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute('content', `${article.subtitle}. A guide for Boston MBTA commuters by ${AUTHOR.name}. ${article.tags.join(', ')}.`)

  // Update canonical
  let canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.href = `${SITE_URL}/guides/${article.slug}`

  // Update og:title and og:description for share previews
  const og = (prop, val) => {
    const el = document.querySelector(`meta[property="og:${prop}"]`)
    if (el) el.setAttribute('content', val)
  }
  og('title', `${article.title} | DWELL`)
  og('description', article.subtitle)
  og('url', `${SITE_URL}/guides/${article.slug}`)
}

function removeArticleSchema() {
  document.getElementById('dwell-article-schema')?.remove()
  document.getElementById('dwell-breadcrumb-schema')?.remove()
  // Restore canonical and meta to homepage defaults
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.href = `${SITE_URL}/`
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute('content',
    'Real-time MBTA arrival times for every subway, commuter rail, and bus stop in Greater Boston. Live predictions, service alerts, and trip planning — free, no account required.')
  const og = (prop, val) => { const el = document.querySelector(`meta[property="og:${prop}"]`); if (el) el.setAttribute('content', val) }
  og('title', 'DWELL | MBTA Live Arrivals')
  og('description', 'Real-time MBTA arrivals for Greater Boston. Subway, commuter rail, and bus.')
  og('url', `${SITE_URL}/`)
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function TagBadge({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: 999,
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
      background: 'var(--bg-4)', border: '1px solid var(--border-mid)',
      color: 'var(--text-muted)',
    }}>{label}</span>
  )
}

function AuthorLine({ date, mins }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'var(--bg-4)', border: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700, color: 'var(--accent)',
        flexShrink: 0,
      }}>M</div>
      <div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {AUTHOR.name}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 2 }}>
          {date} · {mins} min read
        </div>
      </div>
    </div>
  )
}

// ── Article page ──────────────────────────────────────────────────────────────
function ArticlePage({ article, onBack }) {
  useEffect(() => {
    injectArticleSchema(article)
    document.title = `${article.title} | DWELL`
    return () => {
      removeArticleSchema()
      document.title = 'DWELL | MBTA Live Arrivals'
    }
  }, [article])

  return (
    <article className="anim-fade-in">
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em',
        color: 'var(--text-dim)', background: 'transparent', border: 'none',
        cursor: 'pointer', padding: 0, transition: 'color 0.14s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
      >
        <span>←</span> All Guides
      </button>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {article.tags.map(t => <TagBadge key={t} label={t} />)}
      </div>

      <h1 style={{
        fontFamily: 'var(--display)', fontWeight: 800,
        fontSize: 'clamp(20px, 4.5vw, 32px)', letterSpacing: '0.02em',
        color: 'var(--text)', lineHeight: 1.2, marginBottom: 10,
      }}>{article.title}</h1>

      <p style={{
        fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-muted)',
        lineHeight: 1.6, marginBottom: 20,
      }}>{article.subtitle}</p>

      <div style={{ height: 2, background: 'linear-gradient(90deg, var(--accent), var(--cyan), transparent)', marginBottom: 24, borderRadius: 1 }} />

      <AuthorLine date={article.dateDisplay} mins={article.readMins} />

      {/* Intro */}
      <p style={{
        fontFamily: 'var(--sans)', fontSize: 16, color: 'var(--text)',
        lineHeight: 1.85, marginBottom: 32,
        paddingLeft: 18, borderLeft: '3px solid var(--accent)',
        boxShadow: '-4px 0 16px rgba(245,206,62,0.15)',
      }}>{article.intro}</p>

      {/* Sections */}
      {article.content.map((section, i) => (
        <section key={i} style={{ marginBottom: 36 }}>
          <h2 style={{
            fontFamily: 'var(--display)', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.08em', color: 'var(--accent)',
            marginBottom: 14, textTransform: 'uppercase',
          }}>{section.heading}</h2>
          {section.body.split('\n\n').map((para, j) => (
            <p key={j} style={{
              fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text)',
              lineHeight: 1.85, marginBottom: 16,
            }}>{para}</p>
          ))}
        </section>
      ))}

      {/* Author bio */}
      <div style={{
        marginTop: 48, padding: '20px 24px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg-4)', border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--display)', fontSize: 18, fontWeight: 800, color: 'var(--accent)',
          }}>M</div>
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              {AUTHOR.name}
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
              {AUTHOR.bio}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Guides index ──────────────────────────────────────────────────────────────
function GuidesIndex({ onSelect }) {
  return (
    <div className="anim-fade-in">
      <div style={{ paddingLeft: 18, marginBottom: 28, borderLeft: '3px solid var(--accent)', boxShadow: '-4px 0 16px rgba(245,206,62,0.2)' }}>
        <MonoLabel style={{ display: 'block', marginBottom: 8 }}>DWELL</MonoLabel>
        <h1 style={{
          fontFamily: 'var(--display)', fontWeight: 800,
          fontSize: 'clamp(24px, 5vw, 38px)', letterSpacing: '0.04em',
          color: 'var(--text)', lineHeight: 1.1, margin: 0,
        }}>Transit Guides</h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
          Practical guides to getting around Greater Boston, written by real commuters.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ARTICLES.map((a, i) => (
          <button key={a.id} onClick={() => onSelect(a)}
            className="anim-fade-up"
            style={{
              animationDelay: `${i * 0.07}s`,
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '20px 22px', textAlign: 'left',
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(245,206,62,0.05)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(245,206,62,0.1), -4px 0 12px rgba(245,206,62,0.2)'
              e.currentTarget.style.transform = 'translateX(3px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-3)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {a.tags.map(t => <TagBadge key={t} label={t} />)}
            </div>
            <h2 style={{
              fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700,
              letterSpacing: '0.02em', color: 'var(--text)', lineHeight: 1.3,
            }}>{a.title}</h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
              {a.subtitle}
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 2 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
                {AUTHOR.name} · {a.dateDisplay}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)' }}>{a.readMins} min read</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em' }}>READ →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── GuidesPage export ─────────────────────────────────────────────────────────
export default function GuidesPage() {
  const [selected, setSelected] = useState(() => {
    // Support direct links to article slugs e.g. /guides/mbta-commuter-rail-guide
    const path = window.location.pathname
    const slug = path.replace('/guides/', '').replace('/guides', '')
    return slug ? ARTICLES.find(a => a.slug === slug) || null : null
  })

  useEffect(() => {
    if (selected) {
      window.history.pushState({}, '', `/guides/${selected.slug}`)
    } else {
      window.history.pushState({}, '', '/guides')
      document.title = 'Transit Guides | DWELL'
    }
  }, [selected])

  // ItemList schema for guides index — must be above any early return (Rules of Hooks)
  useEffect(() => {
    if (!selected) {
      const id = 'dwell-guides-list-schema'
      let el = document.getElementById(id)
      if (!el) {
        el = document.createElement('script')
        el.id = id
        el.type = 'application/ld+json'
        document.head.appendChild(el)
      }
      el.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'MBTA Transit Guides',
        description: 'Practical guides to using the MBTA in Greater Boston, written by real commuters.',
        url: `${SITE_URL}/guides`,
        numberOfItems: ARTICLES.length,
        itemListElement: ARTICLES.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: a.title,
          url: `${SITE_URL}/guides/${a.slug}`,
          description: a.subtitle,
        })),
      })
    } else {
      document.getElementById('dwell-guides-list-schema')?.remove()
    }
  }, [selected])

  if (selected) return <ArticlePage article={selected} onBack={() => setSelected(null)} />
  return <GuidesIndex onSelect={setSelected} />
}

export { ARTICLES }
