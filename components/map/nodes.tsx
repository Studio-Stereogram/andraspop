"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { KIND_LABEL, NODE_WIDTH, PLATFORMS, STATUS_LABEL } from "@/lib/map/constants";
import { formatDate, hostOf, personMeta } from "@/lib/map/format";
import type { MapNode, Topic } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import { useMapVisual, useNodeState } from "./map-context";
import { Avatar, Thumb, TopicTags } from "./pieces";

export type FlowNodeData = { node: MapNode };
export type FlowNode = Node<FlowNodeData, "entry">;

/**
 * Exactly two connection points per node: ● continuity on the right edge, ◆ reference on the bottom edge.
 * Edges reference them by id (ConnectionMode.Loose lets an edge end on either). Hidden in public mode.
 */
function Ports() {
  return (
    <>
      <Handle id="continuity" type="source" position={Position.Right} isConnectable={false} className="mm-port p-cont" />
      <Handle id="reference" type="source" position={Position.Bottom} isConnectable={false} className="mm-port p-ref" />
    </>
  );
}

function topicsOf(n: MapNode, topicById: ReadonlyMap<string, Topic>): Topic[] {
  return n.topics.map((id) => topicById.get(id)).filter((t): t is Topic => Boolean(t));
}

function PersonCard({ n, state }: { n: MapNode; state: string }) {
  return (
    <div className={cn("mm-node t-person", state)} style={{ width: NODE_WIDTH.person }}>
      <Ports />
      <Avatar node={n} />
      <div className="mm-pbody">
        <span className="mm-pkind">Person{n.private ? " · private" : ""}</span>
        <div className={cn("mm-ntitle", !n.title && "empty")}>{n.title || "Unnamed person"}</div>
        <div className="mm-nmeta">{personMeta(n)}</div>
      </div>
    </div>
  );
}

function EntryCard({ n, state, topicById }: { n: MapNode; state: string; topicById: ReadonlyMap<string, Topic> }) {
  const isVideo = n.type === "video";
  const meta: string[] = [];
  if (!isVideo && n.url) meta.push(hostOf(n.url));
  if (n.date) meta.push(formatDate(n.date));
  else if (isVideo) meta.push("No date yet");

  return (
    <div className={cn("mm-node", `t-${n.type}`, state)} style={{ width: NODE_WIDTH[n.type] }}>
      <Ports />
      <div className="mm-nhead">
        <span>{KIND_LABEL[n.type]}</span>
        {isVideo && n.platform && <Badge variant="outline">{PLATFORMS[n.platform].short}</Badge>}
        {isVideo && n.status && <Badge tone={n.status}>{STATUS_LABEL[n.status]}</Badge>}
        {!isVideo && n.private && <Badge tone="private">Private</Badge>}
      </div>
      {isVideo && <Thumb node={n} topicById={topicById} />}
      <div className="mm-nbody">
        <div className={cn("mm-ntitle", !n.title && "empty")}>{n.title || `Untitled ${KIND_LABEL[n.type].toLowerCase()}`}</div>
        {meta.length > 0 && <div className="mm-nmeta">{meta.join(" · ")}</div>}
        <TopicTags topics={topicsOf(n, topicById)} />
      </div>
    </div>
  );
}

export const EntryNode = memo(function EntryNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { topicById } = useMapVisual();
  const state = useNodeState(id, selected);
  const n = data.node;
  return n.type === "person" ? <PersonCard n={n} state={state} /> : <EntryCard n={n} state={state} topicById={topicById} />;
});

export const nodeTypes = { entry: EntryNode };
