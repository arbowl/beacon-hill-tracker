export interface Update {
  id: number
  date: string // ISO date string (YYYY-MM-DD)
  title?: string
  content: string // Markdown content
  type?: string // Any one-word description (e.g., 'status', 'alert', 'update', 'insight', 'announcement', etc.)
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
- Deep dives into questions like "how are bill summaries structured from committee to committee?" and "what information is lost from bills with absent vote tallies?"

As always, anyone with insight into legislative record-keeping or experience with government datasets is welcome to reach out with questions, concerns, or collaborations. Transparency is a collective effort!`,
  type: 'announcement',
  },
  {
    id: 5,
    date: '2025-12-01',
    title: 'Key Insights from Missing Votes',
    content: `I’ve published a short data brief examining patterns in missing committee vote postings across the 194th General Court. Using descriptive clustering and subject-area comparisons, the report highlights structural documentation gaps visible in public bill records. The findings are preliminary but offer a useful baseline for understanding how vote posting varies by committee and bill type.

[Read the report here (PDF)](/documents/missing_votes.pdf)`,
    type: 'insight',
  },
  {
    id: 6,
    date: '2025-12-02',
    title: 'Legislative Transparency Briefs (Winter Series)',
    content: `As the Legislature enters its year-end lull, a period when formal sessions pause and committee activity slows until early January, the public record offers an opportunity to step back and evaluate broader patterns in procedural transparency.

To support that reflection, the Beacon Hill Compliance Tracker is releasing a series of short analytical briefs over the coming weeks. Each brief examines a different structural aspect of publicly posted committee documentation, such as notice timeliness, summary availability, vote posting rates, and report-out practices.

These analyses are descriptive only and rely exclusively on information visible on bill pages and committee records. They are intended to provide context during a quieter period in the legislative calendar and to help inform ongoing discussions around transparency and public access to legislative information.`,
    type: 'announcement',
  },
  {
    id: 7,
    date: '2025-12-03',
    title: 'Coming Soon: Virtual Bill History Reconstruction Engine',
    content:`With the Legislature in a quieter period, I took the opportunity to conduct a full assessment of the Tracker’s report-out deadline logic. The existing system, while applied consistently and fairly, was designed to look for a small set of expected events on each bill page. That approach works for most bills, but testing showed that bills with more complex histories could occasionally be misinterpreted. In some cases, the logic stopped once it found a matching action, even if the bill’s history continued, or later actions should have overridden earlier ones.

It’s the difference between scanning a book for a few keywords versus reading the whole chapter to understand the plot. Both can get you in the right neighborhood, but only the second reliably captures the full sequence of events in the order they happened.

To address this, I adopted the same methodology that has made the document-detection pipeline successful:
**Build a robust, extensible, plugin-based timeline engine, and make the ruleset responsible only for interpreting its output.**

The new system reconstructs each bill’s full action timeline from the public record, then applies the relevant deadlines and reporting rules to that sequence. This allows the Tracker to:
- Handle referrals, re-referrals, rescheduled hearings, and overrides more accurately
- Avoid premature stopping points
- Treat every committee (and every bill) fairly, including those with irregular or multi-stage histories

Importantly, the timeline engine is designed to grow. New action types, phrasing patterns, and shorthand can be added incrementally without altering the core logic. This mirrors how the document finder works: stable core foundation, extensible methods of discovery.

As with previous improvements, this affects only a small subset of bills, but it advances the Tracker’s long-term goal: to offer a clear, rules-based approximation of committee transparency using only what appears in the public record. Complex cases remain rare, but the system will handle them with greater consistency and fidelity.

I am currently in the testing phase, but results are promising. When done, I plan to release a report detailing any changes in output, as well as the implications of these changes. You can expect this to land in the next week or two.

Any additional enhancements will continue to be documented in the [changelog](https://beaconhilltracker.org/about) and explained here as they develop.`,
    type: 'update',
  },
  {
    id: 8,
    date: '2025-12-04',
    title: 'Upcoming Changes to Implicit Report-Out Classification',
    content: `Since its launch, the Tracker has used a "benefit of the doubt" rule for bills where votes were posted but the official bill history didn’t show a clear reported-out entry. In those cases, the presence of a vote was treated as evidence that the committee had taken action, and the bill was counted as meeting the report-out deadline, a concession by the Tracker so as to not penalize committees for the limitations of the tools used to evalaute them.

As the timeline engine has improved, I can now often recover the actual date of that committee action from the vote record itself. In a future update, when a date is available, either from the bill history or from the vote record, the Tracker will compare that date to the committee’s deadline and mark the bill compliant or non-compliant accordingly.

The "benefit of the doubt" will only apply in the cases where a vote exists but no usable date can be found anywhere. In those situations, the Tracker will still credit the committee for posting votes and reporting out.

This change has the potential to reclassify instances where late actions were previously being "rescued" by the gimme-rule as "Non-Compliant", but it should provide a more accurate picture of how often committees are not only acting, but acting on time.

As always, you will see this reflected in the [changelog](https://beaconhilltracker.org/about) when it lands, accompanied by an acknowlegement in Updates.`,
    type: 'announcement',
  },
  {
    id: 9,
    date: '2025-12-05',
    title: 'Timeline Engine Now Online: Reclassifications Explained',
    content: `## Intro
Today, I’m rolling out the promised update to the Tracker’s underlying timeline engine. This represents the most complicated piece of the model by far, but it’s well worth the effort, as compliance is heavily dictated by timelines. This change improves the tracking of a bill as it passes through different committees.

## Why It Was Needed
Hearing dates, announcements, and report-out dates are all major compliance factors. However, modeling a timeline from non-standardized input text is difficult, compounded by the fact that multiple committees could handle a bill, necessitating proper scoping. The old way required grabbing all relevant keywords, then trying to discard the irrelevant data; however, it became tricky determining how to automatically know what was irrelevant. This new system creates a timeline, which makes chronological ordering a viable path to solving this issue. Now, all bills are not only treated consistently, but also much more accurately with respect to what the public sees.

## How It Works
Before this change, I was looking for keywords to figure out what a committee did with a bill. This worked **most** of the time, but fell apart when bills had non-standard actions, such as [H.4229](https://malegislature.gov/Bills/194/H4229), which in one action: reports, refers, reports out again, and refers again, with two committees named. Since the old way was just looking for keywords, it would get tripped up by this and fail to properly recognize these actions.
The new way uses a "node" system. In short, I created an action-based model of what can actually happen to a bill. Next, I tied key phrases to each action. Then, I build a virtual timeline. Whenever I need to figure out what a committee did with a bill, I narrow the timeline to the committee’s tenure window.
It’s not perfect; it still relies on an inconsistent, human-driven, sometimes incomplete data source. That said, it creates a significantly improved model of what’s presented to the public.

## Impact on Compliance Statistics
If you visit every day, perhaps you noticed that this change resulted in, approximately, a 3-4% drop in global compliance. In short, this is because the tool no longer gets tricked by compliant windows within a bill’s overall history; if one committee is compliant, it no longer has the possibility to trick later analyses.
Here is a [graph](https://i.imgur.com/J1UalBc.png) showing the compliance drop for affected committees. Some are unaffected, and most are only slightly affected. The outlier is the Joint Committee on Agriculture and Fisheries, which dropped due to the fact that the new system differentiates between “Agriculture” (J38) and “Agriculture and Fisheries” (J45).
Here are some examples of reclassified bills which were previously compliant but are now considered non-compliant due to timeline rules:
-	[H.101](https://malegislature.gov/Bills/194/H101)
-	[H.82](https://malegislature.gov/Bills/194/H82)
-	[H.1525](https://malegislature.gov/Bills/194/H1525)

As you can see from the timelines, these were reported out past the deadline, which can now be accurately calculated based on proper committee tenure windows.
**Note: This change reflects an improvement in modeling, not a change in committee behavior.**

## What This Means Going Forward
This is a one-time foundational correction, not an ongoing or recurring volatility issue. Keeping an accurate timeline is crucial for compliance calculations, yet the code to properly parse and model it is more complicated than any other component of the entire project. The new timeline engine provides a stable base for incremental improvements, so while the possibility to catch unique phrases in odd edge cases is on the table, large-scale reclassifications are highly unlikely at this stage.
The goal remains the same: to offer a clear, fair, and transparent approximation of the publicly observable legislative process.`,
    type: 'update',
  },
  {
    id: 10,
    date: '2025-12-07',
    title: 'How Massachusetts Committees Perform on Process and Transparency',
    content: `Until now, committee workflows in the Massachsuetts Legislature have been difficult to quantify. Hearing notices, reschedules, report-out timing, and documentation for summaries and votes posting all vary widely, and the patterns were largely invisible. This analysis introduces the first statewide baseline: a data-driven map of process and transparency compliance across the 194th General Court. It highlights structural trends which provide insight into how committees manage deadlines and documentation.


[Read the report here (PDF)](/documents/typology_matrix.pdf)`,
    type: 'insight',
  },
  {
    id: 11,
    date: '2025-12-14',
    title: 'The Effect of Joint Rule 10 on Average Hearing Notice',
    content: `This brief examines how hearing notice changed after the June 26 update to the Legislature's posting rules. By comparing all committee hearings before and after the rule change, the analysis shows how often hearings received at least 10 days' notice and how committee practices shifted across the session. The goal is to give a clear, data-driven model of how the new rule affected public access.


[Read the report here (PDF)](/documents/hearing_analysis.pdf)`,
    type: 'insight',
  }
]

















