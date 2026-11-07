import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, getCountFromServer, getFirestore, query, where } from "firebase/firestore";
import {
  followUser,
  getFollowCounts,
  getProfile,
  isFollowing,
  unfollowUser,
} from "../utils/profiles";
import Loading from "./Loading";
import type { FollowCounts, PublicProfile } from "../types/profile";
import type { AppUser } from "../types/user";

interface ProfileProps {
  currentUser: AppUser | null;
}

/** One credit line: the label on the left, the figure on the right, a hairline under it. */
const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex min-h-12 items-baseline justify-between gap-4 border-b border-rule py-3">
    <dt className="rp-label">{label}</dt>
    <dd className="text-[20px] font-bold tabular-nums">{value}</dd>
  </div>
);

function initials(name: string | null): string {
  const parts = (name ?? "").match(/\b\w/g) ?? [];
  return ((parts.shift() ?? "") + (parts.pop() ?? "")).toUpperCase() || "?";
}

const Profile = ({ currentUser }: ProfileProps) => {
  const { uid: routeUid } = useParams<{ uid?: string }>();
  const navigate = useNavigate();

  const viewingUid = routeUid ?? currentUser?.uid ?? null;
  const isSelf = Boolean(viewingUid && viewingUid === currentUser?.uid);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [counts, setCounts] = useState<FollowCounts>({
    followers: 0,
    following: 0,
  });
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Which profile is currently in state; anything else means still loading. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    if (!viewingUid) return;

    let cancelled = false;

    (async () => {
      try {
        const [found, followCounts] = await Promise.all([
          getProfile(viewingUid),
          getFollowCounts(viewingUid),
        ]);
        if (cancelled) return;

        setProfile(
          found ??
            (viewingUid === currentUser.uid
              ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName,
                  photoURL: currentUser.photoURL,
                }
              : null)
        );
        setMissing(!found && viewingUid !== currentUser.uid);
        setCounts(followCounts);

        // Only your own notes are readable, so only count them for yourself.
        if (viewingUid === currentUser.uid) {
          const snap = await getCountFromServer(
            query(
              collection(getFirestore(), "notes"),
              where("userId", "==", currentUser.uid)
            )
          );
          if (!cancelled) setNoteCount(snap.data().count);
        } else {
          const already = await isFollowing(currentUser.uid, viewingUid);
          if (!cancelled) setFollowing(already);
        }
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoadedFor(viewingUid);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser, viewingUid, navigate]);

  const toggleFollow = useCallback(async () => {
    if (!currentUser || !viewingUid) return;
    setBusy(true);
    const wasFollowing = following;
    // Optimistic: the counts should move the instant the button is pressed.
    setFollowing(!wasFollowing);
    setCounts((c) => ({
      ...c,
      followers: c.followers + (wasFollowing ? -1 : 1),
    }));
    try {
      if (wasFollowing) await unfollowUser(currentUser.uid, viewingUid);
      else await followUser(currentUser.uid, viewingUid);
    } catch {
      setFollowing(wasFollowing);
      setCounts((c) => ({
        ...c,
        followers: c.followers + (wasFollowing ? 1 : -1),
      }));
    } finally {
      setBusy(false);
    }
  }, [currentUser, viewingUid, following]);

  const loading = loadedFor !== viewingUid;

  if (!currentUser) return null;
  if (loading) return <Loading />;

  if (missing || !profile) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-10 md:px-10 md:pt-10">
        <h1 className="rp-title text-[34px] md:text-[44px]">No such profile</h1>
        <p className="rp-muted mt-3 text-[17px]">
          That account does not exist, or has been deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-10 md:px-10 md:pt-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="flex h-24 w-24 flex-none items-center justify-center overflow-hidden bg-sleeve-2 md:h-28 md:w-28">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="rp-title text-[30px] text-ink-2">
              {initials(profile.displayName)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="rp-title text-[34px] break-words md:text-[44px]">
            {profile.displayName || "A RhymePage user"}
          </h1>
          {isSelf && currentUser.email && (
            <p className="rp-muted mt-2 truncate text-[15px]">{currentUser.email}</p>
          )}
        </div>

        {isSelf ? (
          <button
            type="button"
            className="rp-btn rp-btn--line self-start sm:self-end"
            onClick={() => navigate("/settings")}
          >
            Edit profile
          </button>
        ) : (
          <button
            type="button"
            className={`rp-btn self-start sm:self-end ${following ? "rp-btn--line" : "rp-btn--ink"}`}
            disabled={busy}
            onClick={toggleFollow}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <dl className="mt-8 border-t-[1.5px] border-ink">
        <Stat label="Followers" value={counts.followers} />
        <Stat label="Following" value={counts.following} />
        <Stat label="Notes" value={noteCount ?? "-"} />
      </dl>

      {!isSelf && (
        <p className="rp-muted mt-4 text-[13px]">
          Note counts stay private unless a note is shared with you.
        </p>
      )}
    </div>
  );
};

export default Profile;
