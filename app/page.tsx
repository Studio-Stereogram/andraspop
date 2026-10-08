import { EntryList } from "@/components/map/entry-list";
import { MapApp } from "@/components/map/map-app";
import { getPublicMap } from "@/lib/data/map";

export default async function Home() {
  const map = await getPublicMap();
  return (
    <>
      <MapApp map={map} />
      <EntryList map={map} />
    </>
  );
}
