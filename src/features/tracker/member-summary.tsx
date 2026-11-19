import { Card, CardContent, CardHeader, CardTitle } from "#components/ui/card";
import { currency, number } from "../../lib/tracker";
import type { MemberStats } from "./selectors";

type Props = { members: MemberStats };

export function MemberSummary({ members }: Props) {
  return (
    <section className='space-y-3'>
      <h2 className='text-lg font-semibold'>By person</h2>
      <div className='grid gap-3 sm:grid-cols-2'>
        {members.map((item) => (
          <Card key={item.member}>
            <CardHeader>
              <CardTitle>{item.member}</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-3 gap-2'>
              <div>
                <p className='text-xs text-muted-foreground'>Miles</p>
                <p className='text-lg font-semibold'>{number(item.miles, 1)}</p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>
                  Trip cost (est.)
                </p>
                <p className='text-lg font-semibold'>
                  {currency(item.tripCost)}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Gas paid</p>
                <p className='text-lg font-semibold'>{currency(item.paid)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
