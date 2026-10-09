/**
 * What each permission actually lets someone do, in plain words.
 *
 * This is shown beside the checkbox on the role form, because the key alone
 * ("request.verify") tells a parish priest nothing about what he is handing
 * over. Every line here was written against the routes that actually enforce
 * the permission, not against its name.
 *
 * `title` is the permission in words. `description` is one sentence, no jargon,
 * written for the priest doing the delegating rather than for a developer.
 *
 * `note` is the uncomfortable part, and it is deliberate: eleven of these
 * permissions are enforced by nothing at all today. A card that described them
 * as though they worked would be worse than no card, because somebody would
 * tick one believing they had restricted something. The two cases are not the
 * same and do not share a wording:
 *
 *   - the feature has no screens yet (registers, certificates, finance) —
 *     ticking it changes nothing because there is nothing to do;
 *   - the screens exist and simply are not checked (announcements, events,
 *     reports) — everyone who can sign in can already do it, with or without
 *     this box ticked.
 *
 * Delete a note the day its permission starts being enforced.
 */
export interface PermissionHelp {
  title: string;
  description: string;
  note?: string;
}

const NOT_BUILT = "These screens are not built yet, so ticking this changes nothing today.";
const NOT_CHECKED =
  "Not checked yet — anyone who can sign in to the panel can already do this, ticked or not.";

export const PERMISSION_HELP: Record<string, PermissionHelp> = {
  // ------------------------------------------------------------------ parish
  "parish.read": {
    title: "See parish details",
    description:
      "View the parish's own record and its summary counts. Without this, most pages have nothing to show.",
  },
  "parish.update": {
    title: "Edit parish details",
    description: "Change the parish's name and details, and add or remove a parish altogether.",
  },
  "parish.settings.manage": {
    title: "Change parish settings",
    description: "Change how the parish is set up, separately from its name and address.",
  },

  // --------------------------------------------------------------- structure
  "mandalam.manage": {
    title: "Manage Mandalams",
    description: "Add a zone, rename one, or remove one.",
  },
  "anbiyam.manage": {
    title: "Manage Anbiyams",
    description: "Add an Anbiyam, rename one, or remove one.",
  },
  "substation.manage": {
    title: "Manage substations",
    description: "Add, rename or remove a filial chapel.",
  },

  // ------------------------------------------------------------------ family
  "family.read": {
    title: "See families",
    description:
      "Open the family list and any family's card, including its history. This is the one most other family work depends on.",
  },
  "family.read.own": {
    title: "See their own family only",
    description:
      "For parishioners using the mobile app. Shows the household they belong to and nobody else's.",
  },
  "family.create": {
    title: "Add a family",
    description: "Register a new household and give it a family code.",
  },
  "family.update": {
    title: "Edit a family",
    description: "Correct a household's details — address, phone, and the people in it.",
  },
  "family.transfer": {
    title: "Move a family",
    description:
      "Move a household to another Anbiyam. It is given a new code, and the old one still finds it.",
  },
  "family.close": {
    title: "Close a family",
    description:
      "Mark a household as gone. Its record stays readable, and its number is freed for the next family.",
  },
  "family.access_code.manage": {
    title: "Hand out family access codes",
    description:
      "Issue, check or cancel the code a household types in to fill its own details. The code is shown once, so a lost slip means issuing a new one.",
  },

  // ------------------------------------------------------------------ member
  "member.read": { title: "See members", description: "View the people inside a household." },
  "member.create": { title: "Add a member", description: "Add a person to a household." },
  "member.update": { title: "Edit a member", description: "Correct a person's details." },
  "member.delete": {
    title: "Remove a member",
    description: "Take a person off a household's list.",
  },

  // ------------------------------------------------------------------- visit
  "visit.read": {
    title: "See door-step visits",
    description: "View which households have been visited and what was found.",
  },
  "visit.record": {
    title: "Record a visit",
    description: "Write down what was confirmed at a household's door.",
  },
  "visit.round.manage": {
    title: "Plan visit rounds",
    description: "Set up a round of visits, change it, and close it when it is finished.",
  },

  // ----------------------------------------------------------------- request
  "request.read": {
    title: "Follow change requests",
    description:
      "See requests and how far along they are. Everyone involved needs this, including the person who raised it.",
  },
  "request.raise": {
    title: "Raise a change request",
    description:
      "Ask for a correction — for example, that somebody is missing from a household. Deliberately kept apart from verifying.",
  },
  "request.verify": {
    title: "Verify a change request",
    description:
      "Confirm at the door that a request is true, or turn it down. Cannot approve — that is somebody else's job on purpose.",
  },
  "request.approve": {
    title: "Approve a change request",
    description:
      "Make a verified change final. Nobody may approve a request they raised themselves.",
  },

  // ---------------------------------------------------------------- register
  "register.read": {
    title: "See sacramental registers",
    description: "View baptism, communion, confirmation, marriage and death entries.",
    note: NOT_BUILT,
  },
  "register.create": {
    title: "Add a register entry",
    description: "Record a baptism, marriage, death or other sacrament.",
    note: NOT_BUILT,
  },
  "register.update": {
    title: "Edit a register entry",
    description: "Change details on an entry that has been recorded.",
    note: NOT_BUILT,
  },
  "register.correct": {
    title: "Correct a register entry",
    description:
      "Add a correction to an entry. The original is never erased — the correction sits alongside it.",
    note: NOT_BUILT,
  },

  // ------------------------------------------------------------- certificate
  "certificate.read": {
    title: "See certificates",
    description: "View the certificates that have been issued.",
    note: NOT_BUILT,
  },
  "certificate.issue": {
    title: "Issue a certificate",
    description: "Produce a baptism or marriage certificate from the register.",
    note: NOT_BUILT,
  },

  // ----------------------------------------------------------------- finance
  "fund.manage": {
    title: "Manage offering funds",
    description:
      "Open a collection for the year, change it, and work out what each family owes.",
  },
  "offering.read": {
    title: "See offerings",
    description: "View what families owe and what they have paid.",
  },
  "offering.read.own": {
    title: "See their own offerings only",
    description:
      "For parishioners using the mobile app. Shows their own household's dues and receipts, and lets them pay.",
  },
  "offering.record": {
    title: "Record an offering",
    description: "Write down money received by hand and give a receipt.",
    note: NOT_BUILT,
  },
  "finance.report": {
    title: "See financial reports",
    description: "View the totals of what has been collected.",
    note: NOT_BUILT,
  },

  // ----------------------------------------------------------------- liturgy
  "mass_intention.read": {
    title: "See Mass intentions",
    description: "View the Masses that have been asked for.",
  },
  "mass_intention.manage": {
    title: "Manage Mass intentions",
    description: "Book a Mass a family has asked for, and change one.",
  },

  // ------------------------------------------------------------------- comms
  "announcement.manage": {
    title: "Manage announcements",
    description: "Write and send announcements to the parish.",
    note: NOT_CHECKED,
  },
  "event.manage": {
    title: "Manage events",
    description: "Create and edit parish events.",
    note: NOT_CHECKED,
  },
  "report.manage": {
    title: "Manage reports",
    description: "Upload and edit the reports shared with the parish.",
    note: NOT_CHECKED,
  },

  // ------------------------------------------------------------------ access
  "role.manage": {
    title: "Manage roles",
    description:
      "Create roles and change what is in them. Nobody can put a permission into a role that they do not hold themselves.",
  },
  "user.manage": {
    title: "Manage staff accounts",
    description: "Add staff accounts, see them, and send invitations.",
  },
  "user.assign_role": {
    title: "Give and take away roles",
    description:
      "Grant a role to someone, or revoke it. Never to themselves, and never outside their own parish.",
  },
};

/** Falls back rather than showing an empty card for a permission added later. */
export function permissionHelp(key: string): PermissionHelp {
  return (
    PERMISSION_HELP[key] ?? {
      title: key,
      description: "No description has been written for this permission yet.",
    }
  );
}
