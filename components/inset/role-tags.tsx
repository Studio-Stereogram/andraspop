"use client";

import { Tooltip } from "radix-ui";
import { useState, type CSSProperties } from "react";
import { FAMILIES, ROLES, type Participant } from "@/lib/inset/roles";

// Participants as colour-coded tags. Leads are filled, supporting roles are tinted. Hovering or focusing
// a tag shows what the role does; on touch screens a tap toggles it.

function RoleTag({ participant }: { participant: Participant }) {
  const [open, setOpen] = useState(false);
  const role = ROLES[participant.id];
  const c = FAMILIES[role.family];
  const style = {
    "--tag-bg": participant.lead ? c.solid : c.tint,
    "--tag-ink": participant.lead ? c.onSolid : c.ink,
    "--tag-edge": c.solid,
  } as CSSProperties;

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen} delayDuration={120}>
      <Tooltip.Trigger asChild>
        <button type="button" className="rt-tag" style={style} data-lead={participant.lead || undefined} onClick={() => setOpen((o) => !o)}>
          {role.name}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="rt-tip" side="top" sideOffset={8} collisionPadding={12}>
          <span className="rt-tip-name">
            {role.name}
            {participant.lead ? <span className="rt-tip-lead"> · leads</span> : null}
          </span>
          <span className="rt-tip-def">{role.definition}</span>
          <Tooltip.Arrow className="rt-tip-arrow" width={12} height={6} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function RoleTags({ participants, legend = true }: { participants: Participant[]; legend?: boolean }) {
  const hasLead = participants.some((p) => p.lead);
  return (
    <Tooltip.Provider>
      <ul className="rt-tags">
        {participants.map((p) => (
          <li key={p.id}>
            <RoleTag participant={p} />
          </li>
        ))}
      </ul>
      {legend && hasLead ? <p className="rt-legend">Filled tags lead. Hover a tag for what the role does.</p> : null}
    </Tooltip.Provider>
  );
}
