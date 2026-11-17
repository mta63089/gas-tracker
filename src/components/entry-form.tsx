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
  number,
  today,
  type DriveEntry,
  type Entry,
  type FuelEntry,
  type Member,
} from "../lib/tracker";

export type EditorState =
  | { type: "drive"; entry?: DriveEntry }
  | { type: "fuel"; entry?: FuelEntry };

type EntryFormProps = {
  editor: EditorState;
  currentUser: Member;
  onSave: (entry: Entry) => void;
  onCancel: () => void;
};

const positiveNumber = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

const entrySchema = z
  .object({
    type: z.enum(["drive", "fuel"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a date."),
    person: z.enum(MEMBERS),
    miles: z.string(),
    purpose: z.string(),
    amount: z.string(),
    pricePerGallon: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "drive") {
      if (!positiveNumber(data.miles)) {
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
          message: "Please enter a reason for the trip.",
        });
      }
    } else {
      if (!positiveNumber(data.amount)) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Enter an amount greater than zero.",
        });
      }

      if (!positiveNumber(data.pricePerGallon)) {
        ctx.addIssue({
          code: "custom",
          path: ["pricePerGallon"],
          message: "Enter a valid price per gallon.",
        });
      }
    }
  });

type EntryFormValues = z.infer<typeof entrySchema>;

const TRIP_REASONS = [
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
  onSave,
  onCancel,
}: EntryFormProps) {
  const existing = editor.entry;

  const existingDrive = existing?.type === "drive" ? existing : undefined;

  const existingFuel = existing?.type === "fuel" ? existing : undefined;

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      type: editor.type,
      date: existing?.date ?? today(),
      person: existingDrive?.driver ?? existingFuel?.payer ?? currentUser,
      miles: existingDrive ? String(existingDrive.miles) : "",
      purpose: existingDrive?.purpose ?? "",
      amount: existingFuel ? String(existingFuel.amount) : "",
      pricePerGallon: existingFuel ? String(existingFuel.pricePerGallon) : "",
    },
  });

  const amount = form.watch("amount");
  const pricePerGallon = form.watch("pricePerGallon");

  const gallons =
    positiveNumber(amount) && positiveNumber(pricePerGallon)
      ? Number(amount) / Number(pricePerGallon)
      : 0;

  const estimatedRange = gallons * VEHICLE.mpg;

  function onSubmit(values: EntryFormValues) {
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

      return;
    }

    onSave({
      ...base,
      type: "fuel",
      payer: values.person,
      amount: Number(Number(values.amount).toFixed(2)),
      pricePerGallon: Number(values.pricePerGallon),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
                required
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
                  if (value === "Mike" || value === "Mom") {
                    field.onChange(value);
                  }
                }}
              >
                <SelectTrigger
                  id='entry-person'
                  className='h-11 w-full text-sm'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder='Select person' />
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
                  <FieldLabel htmlFor='drive-miles'>Miles driven</FieldLabel>

                  <Input
                    {...field}
                    id='drive-miles'
                    type='number'
                    inputMode='decimal'
                    min='0.1'
                    step='any'
                    placeholder='e.g. 12.5'
                    required
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
                  <FieldLabel htmlFor='drive-purpose'>
                    Reason for trip
                  </FieldLabel>

                  <Input
                    {...field}
                    id='drive-purpose'
                    placeholder='Where did you go?'
                    required
                    className='h-11 text-sm'
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldDescription>
                    Or select a common reason:
                  </FieldDescription>

                  <div className='flex flex-wrap gap-2'>
                    {TRIP_REASONS.map((reason) => (
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
          </>
        ) : (
          <>
            <Controller
              name='amount'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='fuel-amount'>Amount paid ($)</FieldLabel>

                  <Input
                    {...field}
                    id='fuel-amount'
                    type='number'
                    inputMode='decimal'
                    min='0.01'
                    step='0.01'
                    placeholder='e.g. 35.00'
                    required
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
                  <FieldLabel htmlFor='fuel-price'>
                    Price per gallon ($)
                  </FieldLabel>

                  <Input
                    {...field}
                    id='fuel-price'
                    type='number'
                    inputMode='decimal'
                    min='0.001'
                    step='0.001'
                    placeholder='e.g. 3.099'
                    required
                    className='h-11 text-sm'
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950'>
              <p className='text-sm font-medium'>Estimated fuel purchased</p>

              <p className='mt-2 text-3xl font-semibold'>
                {number(gallons, 2)} gallons
              </p>

              <p className='mt-2 text-sm'>
                Approximately <strong>{number(estimatedRange)} miles</strong> of
                driving range
              </p>

              <p className='mt-3 text-xs text-emerald-800'>
                {VEHICLE.mpg} MPG estimate
                {gallons > 0 && ` · ${currency(Number(amount))} total`}
              </p>
            </div>
          </>
        )}
      </FieldGroup>

      <div className='flex gap-3 border-t pt-4'>
        <Button
          type='button'
          variant='outline'
          className='h-11 flex-1 text-sm'
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type='submit'
          disabled={form.formState.isSubmitting}
          className='h-11 flex-1 bg-emerald-700 text-sm text-white hover:bg-emerald-800'
        >
          {existing ? "Save Changes" : "Save Entry"}
        </Button>
      </div>
    </form>
  );
}
