import { useState, type FormEvent } from 'react';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Button } from '#components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '#components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '#components/ui/field';
import { Input } from '#components/ui/input';

import { EntryForm, type EditorState } from './entry-form';
import type { Entry, FuelEntry, Member } from '../../lib/tracker';

type EntryDialogProps = {
  editor: EditorState | null;
  currentUser: Member;
  purchases: FuelEntry[];
  fallbackPrice: number;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Entry) => void;
};

export function EntryDialog({
  editor, currentUser, purchases, fallbackPrice, onOpenChange, onSave,
}: EntryDialogProps) {
  return (
    <Dialog open={editor !== null} onOpenChange={onOpenChange}>
      {editor && (
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editor.entry ? 'Edit' : 'Add'} {editor.type === 'drive' ? 'trip' : 'gas purchase'}
            </DialogTitle>
            <DialogDescription>Record the details below.</DialogDescription>
          </DialogHeader>
          <EntryForm
            key={editor.entry?.id ?? `${editor.type}-${editor.date ?? 'today'}`}
            editor={editor}
            currentUser={currentUser}
            purchases={purchases}
            fallbackPrice={fallbackPrice}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

type SettingsDialogProps = {
  open: boolean;
  fallbackPrice: number;
  onOpenChange: (open: boolean) => void;
  onSave: (price: number) => Promise<boolean>;
};

/** Mount only while open, so the draft starts at the latest saved price. */
export function SettingsDialog({ open, fallbackPrice, onOpenChange, onSave }: SettingsDialogProps) {
  const [draft, setDraft] = useState(String(fallbackPrice));
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(draft);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a price greater than zero.');
      return;
    }
    const saved = await onSave(price);
    if (saved) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fuel cost settings</DialogTitle>
          <DialogDescription>
            Used for trip estimates when no earlier gas purchase is recorded.
          </DialogDescription>
        </DialogHeader>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor='fallback-price'>Default price per gallon ($)</FieldLabel>
            <Input
              id='fallback-price'
              type='number'
              min='0.001'
              step='0.001'
              className='h-11 text-sm'
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError('');
              }}
            />
            <FieldDescription>
              Actual gas purchase prices take precedence when available.
            </FieldDescription>
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <Button type='submit' className='w-full'>Save settings</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteEntryDialogProps = {
  entry: Entry | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteEntryDialog({ entry, onOpenChange, onConfirm }: DeleteEntryDialogProps) {
  return (
    <AlertDialog open={entry !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the entry from history and updates the totals.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
