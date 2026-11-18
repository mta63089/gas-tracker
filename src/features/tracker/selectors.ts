import {
  MEMBERS,
  estimateTripCost,
  fuelGallons,
  type DriveEntry,
  type Entry,
  type FuelEntry,
} from "../../lib/tracker";

export type Period = "month" | "all";
export type ActivityFilter = "all" | "drive" | "fuel";

export function sortEntries(items: Entry[]): Entry[] {
  return [...items].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function selectPeriodEntries(
  entries: Entry[],
  period: Period,
  monthKey: string,
): Entry[] {
  return period === "all"
    ? entries
    : entries.filter((entry) => entry.date.startsWith(monthKey));
}

export function selectTotals(
  entries: Entry[],
  allPurchases: FuelEntry[],
  fallbackPrice: number,
) {
  const drives = entries.filter(
    (entry): entry is DriveEntry => entry.type === "drive",
  );
  const fuels = entries.filter(
    (entry): entry is FuelEntry => entry.type === "fuel",
  );

  return {
    trips: drives.length,
    drivenMiles: drives.reduce((sum, drive) => sum + drive.miles, 0),
    estimatedTripSpent: drives.reduce(
      (sum, drive) =>
        sum + estimateTripCost(drive, allPurchases, fallbackPrice).cost,
      0,
    ),
    fuelSpent: fuels.reduce((sum, fuel) => sum + fuel.amount, 0),
    gallonsBought: fuels.reduce((sum, fuel) => sum + fuelGallons(fuel), 0),
  };
}

export function selectMemberStats(
  entries: Entry[],
  allPurchases: FuelEntry[],
  fallbackPrice: number,
) {
  const drives = entries.filter(
    (entry): entry is DriveEntry => entry.type === "drive",
  );
  const fuels = entries.filter(
    (entry): entry is FuelEntry => entry.type === "fuel",
  );

  return MEMBERS.map((member) => ({
    member,
    miles: drives
      .filter((drive) => drive.driver === member)
      .reduce((sum, drive) => sum + drive.miles, 0),
    tripCost: drives
      .filter((drive) => drive.driver === member)
      .reduce(
        (sum, drive) =>
          sum + estimateTripCost(drive, allPurchases, fallbackPrice).cost,
        0,
      ),
    paid: fuels
      .filter((fuel) => fuel.payer === member)
      .reduce((sum, fuel) => sum + fuel.amount, 0),
  }));
}

export type MemberStats = ReturnType<typeof selectMemberStats>;

export function selectDayCounts(entries: Entry[]) {
  return entries.reduce<Record<string, { drives: number; fuels: number }>>(
    (counts, entry) => {
      const count = counts[entry.date] ?? { drives: 0, fuels: 0 };
      if (entry.type === "drive") count.drives += 1;
      else count.fuels += 1;
      counts[entry.date] = count;
      return counts;
    },
    {},
  );
}

export type DayCounts = ReturnType<typeof selectDayCounts>;
