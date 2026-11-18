import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#components/ui/alert-dialog";
import { Button } from "#components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import {
  Field,
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
  number,
  type Member,
  type TripPreset,
} from "../../lib/tracker";

const presetSchema = z.object({
  name: z.string().trim().min(2, "Enter a name of at least 2 characters."),
  miles: z
    .string()
    .refine(
      (value) =>
        value.trim() !== "" &&
        Number.isFinite(Number(value)) &&
        Number(value) > 0,
      "Enter a distance greater than zero.",
    ),
  driver: z.enum(["either", "Mike", "Mom"]),
});

type FormValues = z.infer<typeof presetSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: TripPreset[];
  onSave: (preset: TripPreset) => void;
  onDelete: (id: string) => void;
};

export function PresetManager({
  open,
  onOpenChange,
  presets,
  onSave,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState<TripPreset | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TripPreset | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(presetSchema),
    defaultValues: { name: "", miles: "", driver: "either" },
  });

  function startEdit(preset: TripPreset) {
    setEditing(preset);
    form.reset({
      name: preset.name,
      miles: String(preset.miles),
      driver: preset.defaultDriver ?? "either",
    });
  }

  function clearForm() {
    setEditing(null);
    form.reset({ name: "", miles: "", driver: "either" });
  }

  function submit(values: FormValues) {
    onSave({
      id: editing?.id ?? crypto.randomUUID(),
      name: values.name.trim(),
      miles: Number(values.miles),
      defaultDriver:
        values.driver === "either" ? null : (values.driver as Member),
    });
    clearForm();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Manage regular trips</DialogTitle>
            <DialogDescription>
              Save distances for trips you take often. A preset never changes
              trips you've already logged.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            {presets.length === 0 ? (
              <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
                No presets yet. Add your first regular destination below.
              </p>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'
                >
                  <div>
                    <p className='font-medium'>{preset.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {number(preset.miles, 1)} mi ·{" "}
                      {preset.defaultDriver ?? "Choose driver when logging"}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => startEdit(preset)}
                    >
                      Edit
                    </Button>
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      onClick={() => setPendingDelete(preset)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={form.handleSubmit(submit)}
            className='space-y-4 rounded-xl bg-muted/50 p-4'
          >
            <h3 className='font-semibold'>
              {editing ? "Edit preset" : "Add a preset"}
            </h3>
            <FieldGroup>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='preset-name'>Trip name</FieldLabel>
                    <Input
                      {...field}
                      id='preset-name'
                      className='h-10'
                      placeholder='Grocery store'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='miles'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='preset-miles'>
                      Round-trip distance (miles)
                    </FieldLabel>
                    <Input
                      {...field}
                      id='preset-miles'
                      type='number'
                      inputMode='decimal'
                      min='0.1'
                      step='any'
                      className='h-10'
                      placeholder='12.5'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='driver'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='preset-driver'>
                      Default driver
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={(value) => {
                        if (
                          value === "either" ||
                          value === "Mike" ||
                          value === "Mom"
                        )
                          field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id='preset-driver'
                        className='h-10 w-full'
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='either'>
                          Whoever is logging
                        </SelectItem>
                        {MEMBERS.map((member) => (
                          <SelectItem key={member} value={member}>
                            {member}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <div className='flex gap-2'>
              <Button type='submit' className='flex-1'>
                {editing ? "Save changes" : "Add preset"}
              </Button>
              {editing && (
                <Button type='button' variant='outline' onClick={clearForm}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Previously recorded trips will stay in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  onDelete(pendingDelete.id);
                  if (editing?.id === pendingDelete.id) clearForm();
                  setPendingDelete(null);
                }
              }}
            >
              Delete preset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
