import type { Analysis } from "./analysis";

/**
 * Demo analysis used when XAI_API_KEY is not configured, and as the
 * sample path for judges who want an instant look. Same shape as the
 * real Grok payload — swap is invisible to the UI.
 */
export function createSampleAnalysis(mode: "upload" | "type"): Analysis {
  const day = 86400000;
  const now = Date.now();
  return {
    issue_type: "Eviction / Landlord–Tenant",
    jurisdiction: "California, US (demo)",
    summary: [
      {
        text: "This document is a 7-day pay-or-quit notice, which is the first formal step a landlord must take before filing an eviction lawsuit.",
        confidence: "high",
        citation_id: "c1",
      },
      {
        text: "You have 7 days from the date the notice was served to either pay the full amount owed or move out.",
        confidence: "high",
        citation_id: "c1",
      },
      {
        text: "If the notice amount is incorrect — for example, it includes fees your lease or state law does not allow — the notice may be defective and unenforceable.",
        confidence: "medium",
        citation_id: "c2",
      },
      {
        text: "Landlords must generally keep essential services like water and electricity running during the notice period.",
        confidence: "medium",
        citation_id: "c3",
      },
      {
        text: "A landlord cannot legally change the locks, remove your belongings, or shut off utilities to force you out without a court order.",
        confidence: "high",
        citation_id: "c3",
      },
      {
        text: "Some tenants may qualify for emergency rental assistance that can stop the eviction entirely.",
        confidence: "low",
        citation_id: null,
      },
    ],
    red_flags: [
      {
        clause_text: "…landlord may enter the premises at any time without notice…",
        severity: "red",
        bbox: [0.08, 0.18, 0.84, 0.09],
        explanation:
          "This waives your right to reasonable notice before entry. In most states a landlord must give 24–48 hours' notice except in emergencies.",
        citation_id: "c3",
      },
      {
        clause_text: "…tenant waives right to trial by jury in any proceeding…",
        severity: "red",
        bbox: [0.08, 0.46, 0.84, 0.08],
        explanation:
          "Jury-trial waivers in residential leases are unenforceable in many states. A court, not the lease, decides this.",
        citation_id: "c2",
      },
      {
        clause_text: "…late fee of $75 per day applies after the 3rd of the month…",
        severity: "yellow",
        bbox: [0.08, 0.6, 0.84, 0.08],
        explanation:
          "Per-day late fees are capped or banned in several states. $75/day could exceed legal limits — check your local ordinance.",
        citation_id: "c2",
      },
      {
        clause_text: "…security deposit refunded within 30 days at landlord's sole discretion…",
        severity: "yellow",
        bbox: [0.08, 0.74, 0.84, 0.08],
        explanation:
          "Most states set a fixed deadline (14–30 days) for deposit return and do not allow 'sole discretion' refunds.",
        citation_id: null,
      },
    ],
    deadlines: [
      {
        label: "Notice served",
        date: new Date(now - 2 * day).toISOString(),
        urgency: "safe",
      },
      {
        label: "Pay or quit deadline (7 days)",
        date: new Date(now + 5 * day).toISOString(),
        urgency: "soon",
      },
      {
        label: "Court hearing (if filed)",
        date: new Date(now + 21 * day).toISOString(),
        urgency: "safe",
      },
    ],
    draft_response: `[Your Name]
[Your Address]
[Date]

[Landlord's Name]
[Landlord's Address]

Re: Response to 7-Day Pay-or-Quit Notice dated [Date]

Dear [Landlord's Name],

I am writing in response to the notice I received on [Date]. I dispute the amount claimed because it includes late fees of $75 per day, which I believe exceed what my lease and state law allow.

I am requesting an itemized statement of the alleged balance, a copy of my ledger, and clarification of how the late fees were calculated. I intend to pay any amount that is legitimately owed within the notice period once I receive this statement.

Please also confirm in writing that my right to a jury trial and my right to reasonable notice before entry remain in effect, since the lease language on these points appears inconsistent with state law.

I am seeking to resolve this matter without court involvement and look forward to your written reply within 7 days.

Sincerely,
[Your Name]
[Phone / Email]`,
    citations: [
      {
        id: "c1",
        statute: "State Landlord–Tenant Act § sample — Notice to Quit",
        quote:
          "A landlord shall serve written notice specifying the amount due and a period of not less than 7 days to pay or surrender possession.",
        url: "https://www.law.cornell.edu/wex/notice_to_quit",
      },
      {
        id: "c2",
        statute: "State Landlord–Tenant Act § sample — Fees & Waivers",
        quote:
          "Late fees must be reasonable and may not function as a penalty. Waivers of jury trial in residential leases are contrary to public policy.",
        url: "https://www.law.cornell.edu/wex/late_fee",
      },
      {
        id: "c3",
        statute: "State Landlord–Tenant Act § sample — Entry & Essential Services",
        quote:
          "Except in emergency, a landlord shall provide at least 24 hours' notice of entry and shall not interrupt essential services to compel occupancy surrender.",
        url: "https://www.law.cornell.edu/wex/landlord_tenant",
      },
    ],
  };
}
