import { cardStyle, type Inset } from "@/lib/inset/insets";
import { CardArt } from "./card-art";

// What an inset shows until its piece is written: the art large, the title and what it will cover.

export function InProgress({ inset }: { inset: Inset }) {
  return (
    <div className="ip" style={cardStyle(inset)}>
      <div className="ip-art in-grain">
        <CardArt kind={inset.art} ink={inset.ink} width={560} height={240} />
      </div>
      <p className="in-kicker">In progress</p>
      <h1 className="ip-title in-serif">{inset.title}</h1>
      <p className="ip-summary">{inset.summary}</p>
      {inset.notes && (
        <ul className="ip-notes" aria-label="What it will cover">
          {inset.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
