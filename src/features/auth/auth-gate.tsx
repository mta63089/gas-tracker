import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { Button } from "#components/ui/button";
import { supabase } from "../../lib/supabase";
import type { Member } from "../../lib/tracker";
import { TrackerDashboard } from "../tracker/tracker-dashboard";
import { SignIn } from "./sign-in";

type MembershipCheck = {
  userId: string;
  member: Member | null;
  error: string | null;
};

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [membership, setMembership] = useState<MembershipCheck | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setCheckingSession(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    // Membership is looked up in the database, not guessed from email/metadata.
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("tracker_members")
          .select("name")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        const name = data?.name;
        if (active)
          setMembership({
            userId,
            member: name === "Mike" || name === "Mom" ? name : null,
            error: null,
          });
      } catch (cause) {
        if (active)
          setMembership({
            userId,
            member: null,
            error:
              cause instanceof Error
                ? cause.message
                : "Could not load membership.",
          });
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  if (checkingSession || (user && membership?.userId !== user.id)) {
    return (
      <main className='grid min-h-screen place-items-center bg-background text-muted-foreground'>
        Loading Gas Tracker...
      </main>
    );
  }
  if (!user) return <SignIn />;

  if (!membership?.member) {
    return (
      <main className='grid min-h-screen place-items-center bg-background px-4 text-foreground'>
        <div className='max-w-sm space-y-4 text-center'>
          <h1 className='text-lg font-semibold'>Account not linked</h1>
          <p className='text-sm text-muted-foreground'>
            {membership?.error ??
              "This account needs to be added to tracker_members by the project administrator."}
          </p>
          <Button
            variant='outline'
            onClick={() => void supabase.auth.signOut()}
          >
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  return (
    <TrackerDashboard
      member={membership.member}
      onSignOut={() => void supabase.auth.signOut()}
    />
  );
}
