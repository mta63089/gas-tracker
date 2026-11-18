import { ThemeSwitch } from "./theme-switch";
import { Button } from "#components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";

import { MEMBERS, type Member } from "../../lib/tracker";

type Props = {
  currentUser: Member;
  onUserChange: (user: Member) => void;
  onOpenPresets: () => void;
  onOpenSettings: () => void;
};

export function AppHeader({
  currentUser,
  onUserChange,
  onOpenPresets,
  onOpenSettings,
}: Props) {
  return (
    <header className='border-b bg-card'>
      <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6'>
        <div className='flex items-center gap-3'>
          <img
            src='/logo.png'
            alt=''
            className='size-16 shrink-0 object-contain'
          />
          <h1 className='font-title text-5xl tracking-wide sm:text-6xl'>
            Gas <span className='text-[#f06479]'>Tracker</span>
          </h1>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <ThemeSwitch />
          <Button variant='outline' onClick={onOpenPresets}>
            Trip presets
          </Button>
          <Button variant='outline' onClick={onOpenSettings}>
            Settings
          </Button>
          <Select
            value={currentUser}
            onValueChange={(value) => {
              if (value === 'Mike' || value === 'Mom') onUserChange(value);
            }}
          >
            <SelectTrigger className='w-28 bg-card' aria-label='Acting as'>
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
        </div>
      </div>
    </header>
  );
}
