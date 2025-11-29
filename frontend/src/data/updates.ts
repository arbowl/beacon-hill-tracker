export interface Update {
  id: number
  date: string // ISO date string (YYYY-MM-DD)
  title?: string
  content: string // Markdown content
  type?: string // Any one-word description (e.g., 'status', 'alert', 'update', 'musing', 'announcement', etc.)
}

export const updates: Update[] = [
  {
    id: 1,
    date: '2025-11-21',
    title: 'Updates',
    content: `This is where I'll post status updates, site-down alerts, and relevant musings about the project.

You can expect updates about:
- System status and maintenance
- New features and improvements
- Interesting findings from the data
- Thoughts on legislative transparency

Stay tuned!`,
    type: 'update'
  },
  {
    id: 2,
    date: '2025-11-21',
    title: 'Improvements to Reported-Out and Hearing Announcement Detection',
    content: `I've noticed that the algorithm seems to get tripped up by bills with more complex histories, such as [H.56](https://malegislature.gov/Bills/194/H56). I aim to evaluate each bill within the window it was handled by a committee, so it's important to correctly attribute each window to the correct committee.

The complexity comes from the fact that, while the writing used to communicate reported-out status and hearings _tends_ to be generally consistent, it's not actually standardized. There are a few common ways they tend to get typed, but it's a balancing act between correctly identifying the action without being so broad so as to accept false positives. That, and since we're evaluating user-facing announcements (rather than confirmed calendar dates), we can use legislative calendars to _help_ verify results, but the goal is to evaluate what the public actually sees, not what’s buried in backend data. Citizens interface with the legislature through these announcements, not APIs and URL hints.

I'm working on a smarter system which makes a few improvements to the existing algorithm:
- Automatically discard rows for which the branch does not match the committee the bill was handled by.
- Leverage bill hearing lists to help verify the intended hearing announcement date.
- Reject rows which are procedurally impossible or illogical.
- Recalculate the notice gap based on the latest rescheduling of a hearing.

I am pursuing these improvements out of a commitment to transparency and accuracy, but note that this does only affect a small subset of bills, the logic is applied evenly to all committees, and it rarely changes a bill’s overall compliance outcome by itself. And, frankly, if it's difficult for an automated tool to analyze a bill, it's not much easier for citizens, which is the exact problem this project aims to shine a spotlight on.`,
    type: 'alert'
  },
  {
    id: 3,
    date: '2025-11-22',
    title: 'Update on Report-Outs and Hearing Announcements',
    content: `I worked on the reported-out and hearing announcement detection algorithms, ran tests, and landed on a system I'm happier with for today's report. In short, the old system evaluated compliance partially based on what it discovered had happened, rather than adhering solely to what was actually announced. While this technically aligned with real-life events as they transpired, it was not a good marker of the story the bill pages told, and could result in situations where the final compliance calculation didn't match what you would actually see in the public record. By using one unified public dataset, the tool shifts away from being a procedural monitor and closer toward its intended purpose as a transparency and compliance tracker.
    
This is the most brittle part of the algorithm due to the constraints, so I'll be on the lookout for further tweaks that need to be made, and will communicate any changes here and in the [changelog](https://beaconhilltracker.org/about). As always, I encourage users to confirm their findings on a bill-by-bill basis using the official Legislature website. The dashboard makes a best-effort attempt to aggregate relevant documentation and grade all committees fairly according to a common ruleset, but it doesn't replace primary sources.`,
  type: 'update',
  },
  {
    id: 4,
    date: '2025-11-29',
    title: 'What have we learned so far?',
    content: `As the Beacon Hill Compliance Tracker settles into regular daily updates, having run for a few consecutive weeks now, I've taken some time to look at what the first few weeks of data reveal about the structure of legislative transparency in Massachusetts.

In numbers:
- Total compliance for all bills hovers around **60-67%**, with the number of fully-compliant bills hovering closer to **11-12%**. New bills can raise provisional compliance, while large numbers of bills crossing a common deadline at once without necessary documentation can quickly sink it.
- The number-one most consistently missing piece of evidence is **vote records**, with 2,191 bills currently non-compliant in this regard---more than a quarter of all bills.
- Committees announced hearings too soon in advance of (or, sometimes, after) a hearing 2,063 times, or **23.7%** of the time.

One emerging theme is that procedural transparency varies more in the documentation layer than in the underlying legislative mechanics. Hearing notices, summaries, and committee actions generally have broadly recognizable patterns when zooming out, but the phrasing, placement, and timing of these postings are not standardized across all committees. This means that two bills handled on the same day, given the same compliant treatment, can look _very_ different to the public simply because of how and where the information was presented.

This early observation reinforces the purpose of this tool: to make the public-facing legislative record easier to interpret. The BHCT doesn't replace official sources, but it does massively shortcut the process of finding and tracking the progress indicators of a bill.

Over the next few weeks, I'll be exploring some ideas unlocked by the opportunities presented by this tool:
- Weekly and monthly trend analysis, in addition to the existing daily analysis
- More ways to export data types for various analytical and research purposes
- Deep dives into questions like "can the aggregation of summaries aid accuracy measurements?" and "what information is lost from bills with absent vote tallies?"

As always, anyone with insight into legislative record-keeping or experience with government datasets is welcome to reach out with questions, concerns, or collaborations. Transparency is a collective effort!`,
  type: 'announcement',
  },
]





