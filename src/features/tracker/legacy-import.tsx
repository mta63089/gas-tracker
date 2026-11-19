import { useState } from "react";
import { Button } from "#components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#components/ui/card";

type Props = {
  counts: { entries: number; presets: number; alreadyImported: boolean };
  onImport: () => Promise<boolean>;
};

export function LegacyImport({ counts, onImport }: Props) {
  const [working, setWorking] = useState(false);
  if (counts.alreadyImported || (counts.entries === 0 && counts.presets === 0)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import existing browser data</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          This browser has {counts.entries} saved entries and {counts.presets} trip presets.
          Import them into the shared database once. Matching IDs are skipped, not overwritten.
          Your original browser data is kept as a backup.
        </p>
        <Button disabled={working} onClick={() => {
          setWorking(true);
          void onImport().finally(() => setWorking(false));
        }}>
          {working ? "Importing..." : "Import browser data"}
        </Button>
      </CardContent>
    </Card>
  );
}
