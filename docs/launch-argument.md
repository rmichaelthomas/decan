# Decan, Proper Time, and the Layer Before Schedules

There is a layer of software that almost everyone uses and almost nobody names correctly.

We call it scheduling. We call it calendaring. We call it recurrence. We call it cron. We call it reminders, automations, triggers, deadlines, timers, retries, expirations, SLAs, freshness windows, scan cadence, quiet hours, rate limits, embargoes, follow-ups, maintenance windows, and "run this every Monday."

Those are all real things. They are not the same thing.

Decan begins from the suspicion that "time" in software has been flattened too early. A person expresses an intent. A product turns that intent into a field. A scheduler turns that field into a trigger. A runtime turns the trigger into execution. A log says something happened. Somewhere in that chain, the original meaning often disappears.

Proper Time is the name for the missing layer: temporal intent as meaning plus evidence.

Decan is the reference implementation.

## The old standards still matter

This project is not an argument that cron is bad. Cron is one of the most successful tiny languages in computing because it does one job with ruthless compression. Five fields can carry an enormous amount of practical scheduling work.

This project is not an argument that iCalendar or RRULE is bad. RFC 5545 is durable because calendar objects need a shared recurrence vocabulary, and the world benefits when systems can exchange that vocabulary.

The problem is not that old standards failed. The problem is that their success caused us to ask them to represent things they were not designed to preserve.

Cron is good at triggers. RRULE is good at recurrence. Calendar APIs are good at calendar objects. Job schedulers are good at launching work. None of those layers, by itself, is the full meaning of temporal intent.

When someone says "send this every Monday morning," the product may need to know:

- Which timezone governs morning?
- Did the person mean a clock point, a semantic window, or the first available slot?
- What happens if Monday is a holiday?
- What happens if the account is suspended?
- What is the first eligible date?
- Is this a civil recurrence or elapsed duration?
- Which facts were explicit, inferred, imported, or defaulted?
- Which snapshots would let another machine replay the same result later?

The usual answer is to collapse all of that into whatever the next system can store. Sometimes that is fine. Sometimes it is a quiet corruption.

Decan exists for the cases where it is not fine.

## Human-first

Human-first means the durable representation should be readable by a person who has not memorized a scheduler dialect.

This does not mean Decan accepts arbitrary natural language and magically understands it. That would be a different project, and probably a less honest one. Natural language can be source evidence. Decan source is the inspectable semantic form.

A human should be able to read:

```decan
time
  relation
    after @approval
    offset 3 business days
```

and understand the essential claim: the target is after an approval reference, offset by three business days. The human does not need to know how a particular job runner names that field, whether a calendar API stores it as a recurrence, or how an agent prompt happened to phrase it.

The human surface matters because time is where software quietly breaks trust. People notice when reminders fire at the wrong local time. They notice when a deadline moved because daylight saving time happened. They notice when "every week" becomes "every 604800 seconds" and slowly stops matching their civil life. They notice when an automation runs after a thing was paused.

Human-first Decan gives reviewers something to inspect before the system acts.

## Agent-friendly

Agent-friendly means the machine surface should be explicit enough that an agent does not need to guess.

Agents are very good at smoothing over missing details. That can be helpful in prose. It is dangerous at the boundary where prose becomes execution. An agent converting "Monday morning" into a scheduler job should not silently choose a timezone, infer a locale, or decide what "morning" means because the host environment happened to have a clock.

Decan's answer is to expose the uncertainty:

- parse or fail;
- canonicalize or fail;
- validate or report stable errors;
- classify support as exact, needs, unsupported, or conflicted;
- resolve only over a finite horizon;
- consume only explicit context and reference snapshots;
- materialize only selected resolved candidates;
- replay enough evidence for later inspection.

That is agent-friendly in the grown-up sense. Not "the agent can do anything." The agent can know what it is doing.

## Why "Proper Time"

The phrase Proper Time stayed from the early primitive exploration because it carries the right pressure. It sounds slightly philosophical, slightly standards-shaped, and slightly stubborn. Good. Time in software deserves stubbornness.

Proper Time is not a claim that Decan owns time. It is a claim that there is a proper layer for temporal meaning:

```text
Source → Interpretation → TemporalExpression → Resolution → Occurrence
```

Outside that layer sit:

```text
Authority → Execution → Verification → Fulfillment
```

The split is not academic. It prevents category errors.

Understanding when something should happen is not the same as being allowed to do it. Triggering a job is not proof that the work completed. Observing a condition is not the same as resolving a temporal expression. A timestamp is not necessarily the meaning of the schedule that produced it.

Decan keeps those boundaries visible.

## What Decan is

Decan is a TypeScript reference implementation of a temporal-intent language.

It includes:

- readable source;
- deterministic canonical form;
- typed JSON and TypeScript interfaces;
- stable hashes;
- semantic validation;
- exact resolver support classification;
- finite deterministic resolution;
- explicit context snapshot adapters;
- explicit reference snapshots;
- civil-time gap and fold handling;
- loss-aware cron/RRULE adapters;
- materialization and replay checks;
- real consumer evidence cases;
- a CLI;
- an MCP server for agent hosts.

That list is intentionally practical. A standard-shaped idea needs a working implementation or it risks becoming vocabulary vapor. Decan is not merely a manifesto; it runs.

## What Decan is not

Decan is not a scheduler.

It does not authorize work. It does not execute work. It does not retry work. It does not verify outcomes. It does not declare obligations fulfilled.

Decan is not a calendar server.

It does not store your calendar, poll your availability, fetch holidays, or merge event feeds.

Decan is not an ambient inference engine.

It does not read the host clock, host timezone, browser locale, geolocation, network state, account state, or dynamic observers. If Decan needs context, it reports a need. If a caller has evidence, the caller supplies a snapshot.

Decan is not a full implementation of RFC 5545.

It respects the RFC 5545/iCalendar world and currently provides exact cron/RRULE interop for a deliberately small weekly subset. It fails closed when conversion would lose meaning. That is not a weakness; it is the safety rule that lets the adapter be trusted.

## Why the corpus matters

The easiest way to overclaim a primitive is to talk only in abstractions. The Proper Time corpus prevents that.

The corpus contains real consumer-shaped cases from:

- 5xFive / Banneker 1 Automations;
- Seshat dependency scan scheduling;
- the Cloudflare backward-channel package from the primitive exploration.

Each case has source, pinned expectations, derivation checks, materialization/replay expectations, and observed gaps. This matters because the gap is part of the evidence. A primitive that cannot say what it cannot do is not safe enough for agents and not honest enough for people.

5xFive shows the bridge from a real product automation to Decan source and back toward cron/RRULE-style interop. Seshat shows policy-shaped scheduling where cadence is only one part of the meaning. The Cloudflare backward-channel package shows obligation timing, where "when" is tied to responsibility, verification, and lifecycle.

Together they show why Decan is not merely a prettier cron.

## The CLI matters

A primitive becomes real when it can be touched from a terminal.

The Decan CLI is deliberately direct:

```bash
decan canonicalize intent.ti
decan validate intent.ti
decan support intent.ti
decan resolve intent.ti --reference-time 2026-08-27T12:00:00Z --horizon-count 3 --context context.json
decan import-cron "0 9 * * 1" --effective-from 2026-08-27
decan import-rrule --dtstart 20260831T090000 --rrule FREQ=WEEKLY;INTERVAL=1;BYDAY=MO
decan materialize --intent-id fivexfive.banneker1.automation.weekly-digest --intent-version 1 --resolution resolution.json --candidate-id sha256:candidate --recorded-at 2026-08-27T21:53:00Z
```

The commands are not glamorous. They are important because they provide a stable operational vocabulary. People can inspect output. Agents can call the same commands. CI can lock behavior. Docs can be executable rather than decorative.

## The MCP server matters

If Decan is agent-friendly, it should not only be usable by agents through shell commands. It should expose an agent-native surface.

The MCP server gives hosts tools for:

- canonicalizing Decan source;
- validating temporal intent;
- classifying resolver support;
- resolving with explicit snapshots;
- importing cron;
- importing RRULE;
- exporting RRULE;
- materializing selected candidates.

It also exposes resources for the Proper Time spec, conformance notes, corpus, and launch argument, plus prompts that guide models through explanation and conversion.

That makes Decan usable in the place where temporal ambiguity increasingly appears: conversations with agents that can act.

The goal is not to let an agent "schedule things" by vibe. The goal is to give an agent a stricter layer between vibe and action.

## The standard-shaped claim

Calling Decan standards-shaped is intentionally different from saying Decan is a standard.

A standard needs community, adversarial implementations, adoption pressure, compatibility work, governance, and time. Decan has none of that yet. What Decan has is a serious primitive, a reference implementation, a corpus, and a set of boundaries that are precise enough to argue with.

That is the correct public posture.

Decan can be presented as:

> a proposed temporal-intent layer for human-first, agent-friendly scheduling systems.

Or:

> a reference implementation for Proper Time: temporal meaning plus evidence before calendars, schedulers, and agents act.

Those statements are ambitious. They are also accurate.

## Why this can be public now

The initial endpoint was reached when Decan could build an executable corpus of real intents, pinned snapshots, expected candidates, derivations, materialization/replay expectations, and observed gaps.

That endpoint is important because it means Decan is no longer just a shape in a notebook. It can take a real consumer case and run it through the primitive.

The public-interface sprint adds the missing dissemination layer:

- a package surface that names the library honestly;
- a CLI for direct use;
- an MCP server for agents;
- a corpus page for evidence;
- a landing page for orientation;
- a long-form argument for the larger idea.

That is enough to begin talking about Decan publicly without pretending it is more mature than it is.

## How to talk about it

The best public explanation is not "I built a scheduling DSL."

That sounds small and wrong.

The better explanation is:

> I built Decan, a reference implementation for Proper Time: a human-first, agent-friendly way to represent temporal intent before it gets flattened into cron, RRULE, timestamps, or scheduler jobs.

Then show the problem:

```text
"every Monday morning after approval unless the account is suspended"
```

Then show the old flattening:

```text
0 9 * * 1
```

Then show the preserved form:

```decan
time
  relation
    after @approval
    offset 3 business days
  except @account-suspended
context
  timezone @domain-timezone
  calendar @business-calendar
```

Then show the consequence:

```text
Decan can say:
- here is the canonical intent;
- here is the support classification;
- here is the evidence needed;
- here are the finite candidates if evidence is supplied;
- here is what cannot be safely inferred.
```

That is the pitch.

## The line to keep

Decan should be audacious in public, but it should never become slippery.

Do not say it replaces calendars. Say it sits before them.

Do not say it replaces cron. Say it can import/export exact subsets and explain when cron would lose meaning.

Do not say it makes agents safe. Say it gives agents a stricter temporal contract.

Do not say it is a standard. Say it is standards-shaped and ready for critique.

Do not hide the limitations. The limitations are part of the integrity of the primitive.

## The invitation

The next public step is not mass adoption. It is contact with the right people:

- builders maintaining recurring automation systems;
- agent developers who need reliable time semantics;
- calendaring people who understand recurrence pain;
- protocol people who care about evidence and replay;
- infrastructure people who have been burned by timezone and scheduler edge cases.

The ask is simple:

> Where does your system currently flatten temporal intent too early?

That question is more powerful than a demo video. It lets Decan meet real use.

## Closing

Software has treated time as a field, a trigger, a timestamp, or a recurrence object for a long time. Those representations are useful, but they are not enough for the world we are entering.

Agents will read schedules. Agents will propose deadlines. Agents will migrate cron jobs. Agents will interpret "next business day" and "after approval" and "during quiet hours" and "before expiration." If they do that through ambient guessing, the future gets brittle fast.

Decan is a bet that the right layer is small, explicit, readable, replayable, and humble about what it cannot know.

Proper Time is the name of that layer.

Decan is the first implementation.

The primitive is built. Now it can be argued with.
