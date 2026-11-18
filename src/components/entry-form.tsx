/* eslint-disable react-hooks/incompatible-library */
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "#components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";

import {
  MEMBERS,
  VEHICLE,
  currency,
  estimateTripCost,
  number,
  today,
  type DriveEntry,
  type Entry,
  type FuelEntry,
  type Member,
} from "../lib/tracker";

export type EditorState =
  | { type: "drive"; entry?: DriveEntry; date?: string }
  | { type: "fuel"; entry?: FuelEntry; date?: string };

type Props = {
  editor: EditorState;
  currentUser: Member;
  purchases: FuelEntry[];
  fallbackPrice: number;
  onSave: (entry: Entry) => void;
  onCancel: () => void;
};

const positive = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

const schema = z
  .object({
    type: z.enum(["drive", "fuel"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date."),
    person: z.enum(MEMBERS),
    miles: z.string(),
    purpose: z.string(),
    amount: z.string(),
    pricePerGallon: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "drive") {
      if (!positive(data.miles)) {
        ctx.addIssue({
          code: "custom",
          path: ["miles"],
          message: "Enter a distance greater than zero.",
        });
      }
      if (!data.purpose.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["purpose"],
          message: "Enter a reason for this trip.",
        });
      }
    } else {
      if (!positive(data.amount)) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Enter an amount greater than zero.",
        });
      }
      if (!positive(data.pricePerGallon)) {
        ctx.addIssue({
          code: "custom",
          path: ["pricePerGallon"],
          message: "Enter a valid price per gallon.",
        });
      }
    }
  });

type Values = z.infer<typeof schema>;
const REASONS = [
  "Groceries",
  "Appointment",
  "Errands",
  "Shopping",
  "Work",
  "Personal",
];

export function EntryForm({
  editor,
  currentUser,
  purchases,
  fallbackPrice,
  onSave,
  onCancel,
}: Props) {
  const existing = editor.entry;
  const drive = existing?.type === "drive" ? existing : undefined;
  const fuel = existing?.type === "fuel" ? existing : undefined;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: editor.type,
      date: existing?.date ?? editor.date ?? today(),
      person: drive?.driver ?? fuel?.payer ?? currentUser,
      miles: drive ? String(drive.miles) : "",
      purpose: drive?.purpose ?? "",
      amount: fuel ? String(fuel.amount) : "",
      pricePerGallon: fuel ? String(fuel.pricePerGallon) : "",
    },
  });

  const miles = form.watch("miles");
  const date = form.watch("date");
  const amount = form.watch("amount");
  const price = form.watch("pricePerGallon");

  const estimatedCost = positive(miles)
    ? estimateTripCost({ date, miles: Number(miles) }, purchases, fallbackPrice)
    : null;
  const gallons =
    positive(amount) && positive(price) ? Number(amount) / Number(price) : 0;

  function submit(values: Values) {
    const base = {
      id: existing?.id ?? crypto.randomUUID(),
      date: values.date,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      createdBy: existing?.createdBy ?? currentUser,
    };

    if (values.type === "drive") {
      onSave({
        ...base,
        type: "drive",
        driver: values.person,
        miles: Number(values.miles),
        purpose: values.purpose.trim(),
      });
    } else {
      onSave({
        ...base,
        type: "fuel",
        payer: values.person,
        amount: Number(Number(values.amount).toFixed(2)),
        pricePerGallon: Number(values.pricePerGallon),
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className='space-y-5'>
      <FieldGroup>
        <Controller
          name='date'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='entry-date'>Date</FieldLabel>
              <Input
                {...field}
                id='entry-date'
                type='date'
                className='h-11 text-sm'
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='person'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='entry-person'>
                {editor.type === "drive" ? "Who drove?" : "Who paid?"}
              </FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={(value) => {
                  if (value === "Mike" || value === "Mom")
                    field.onChange(value);
                }}
              >
                <SelectTrigger
                  id='entry-person'
                  className='h-11 w-full text-sm'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERS.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {editor.type === "drive" ? (
          <>
            <Controller
              name='miles'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='entry-miles'>Miles driven</FieldLabel>
                  <Input
                    {...field}
                    id='entry-miles'
                    type='number'
                    inputMode='decimal'
                    min='0.1'
                    step='any'
                    placeholder='12.5'
                    className='h-11 text-sm'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='purpose'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='entry-purpose'>
                    Reason for trip
                  </FieldLabel>
                  <Input
                    {...field}
                    id='entry-purpose'
                    placeholder='Where did you go?'
                    className='h-11 text-sm'
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Or choose a common reason:
                  </FieldDescription>
                  <div className='flex flex-wrap gap-2'>
                    {REASONS.map((reason) => (
                      <Button
                        key={reason}
                        type='button'
                        size='sm'
                        variant={field.value === reason ? "default" : "outline"}
                        className='rounded-full'
                        onClick={() =>
                          form.setValue("purpose", reason, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      >
                        {reason}
                      </Button>
                    ))}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950'>
              <p className='text-xs font-medium'>Estimated fuel cost</p>
              <p className='mt-1 text-2xl font-semibold'>
                {estimatedCost ? currency(estimatedCost.cost) : "—"}
              </p>
              <p className='mt-1 text-xs text-emerald-800'>
                {estimatedCost
                  ? `${number(estimatedCost.gallons, 2)} gallons at ${currency(estimatedCost.pricePerGallon)}/gal (${estimatedCost.source === "purchase" ? "recorded price" : "fallback price"})`
                  : "Enter miles to calculate an estimate."}
              </p>
            </div>
          </>
        ) : (
          <>
            <Controller
              name='amount'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='entry-amount'>
                    Amount paid ($)
                  </FieldLabel>
                  <Input
                    {...field}
                    id='entry-amount'
                    type='number'
                    inputMode='decimal'
                    min='0.01'
                    step='0.01'
                    placeholder='35.00'
                    className='h-11 text-sm'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='pricePerGallon'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='entry-price'>
                    Price per gallon ($)
                  </FieldLabel>
                  <Input
                    {...field}
                    id='entry-price'
                    type='number'
                    inputMode='decimal'
                    min='0.001'
                    step='0.001'
                    placeholder='3.099'
                    className='h-11 text-sm'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950'>
              <p className='text-xs font-medium'>Estimated fuel purchased</p>
              <p className='mt-1 text-2xl font-semibold'>
                {number(gallons, 2)} gallons
              </p>
              <p className='mt-1 text-xs text-emerald-800'>
                Approximately {number(gallons * VEHICLE.mpg)} miles of driving
                range
              </p>
            </div>
          </>
        )}
      </FieldGroup>

      <div className='flex gap-3 border-t pt-4'>
        <Button
          type='button'
          variant='outline'
          className='h-11 flex-1'
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          className='h-11 flex-1 bg-emerald-700 text-white hover:bg-emerald-800'
        >
          {existing ? "Save changes" : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
