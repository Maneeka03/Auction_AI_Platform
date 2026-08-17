// "use client";

// import { AlertCircle, ArrowLeft, Clock, Gavel, Lock, Package, Star, Users } from "lucide-react";
// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { BiddingChatPanel } from "@/components/bidding/BiddingChatPanel";
// import { ConnectionStatusBadge } from "@/components/bidding/ConnectionStatusBadge";
// import { QuickBidButtons } from "@/components/bidding/QuickBidButtons";
// import { BidHistoryList } from "@/components/bidding/BidHistoryList";
// import { placeBid, listBids } from "@/lib/api/bids";
// import { ApiRequestError } from "@/lib/api/client";
// import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/lib/api/watchlist";
// import { useBiddingRoom } from "@/lib/hooks/useBiddingRoom";
// import { useCountdown } from "@/lib/hooks/useCountdown";
// import { useAuth } from "@/lib/auth/session-context";
// import { can } from "@/lib/auth/permissions";
// import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
// import type { Bid } from "@/types/bid";

// function formatMoney(value: string | null): string {
//   return value ? `$${Number(value).toLocaleString()}` : "—";
// }

// export default function LiveBiddingRoomPage() {
//   const params = useParams<{ id: string }>();
//   const auctionId = params.id;
//   const { accessToken, session } = useAuth();

//   const { auction, connectionState, eventCount, chatMessages, sendChat } = useBiddingRoom(
//     auctionId,
//     accessToken,
//   );
//   const countdown = useCountdown(auction?.ends_at ?? new Date().toISOString());

//   const [bids, setBids] = useState<Bid[]>([]);
//   const [customAmount, setCustomAmount] = useState("");
//   const [isBidding, setIsBidding] = useState(false);
//   const [bidError, setBidError] = useState<{ code: string; message: string } | null>(null);

//   const [isWatched, setIsWatched] = useState(false);
//   const [watchlistLoading, setWatchlistLoading] = useState(false);

//   const isBuyer = session?.roles.includes("buyer") ?? false;
//   const isSeller = session?.roles.includes("seller") ?? false;
//   const canBid = isBuyer && !!session && can(session.permissions, "bid_management", "full");
//   const canChat = isBuyer && !isSeller;

//   useEffect(() => {
//     if (!accessToken || !auction?.property_id) return;
//     listWatchlist(accessToken)
//       .then((items) => setIsWatched(items.some((i) => i.property.id === auction.property_id)))
//       .catch(() => {});
//   }, [accessToken, auction?.property_id]);

//   async function toggleWatchlist() {
//     if (!accessToken || !auction?.property_id || watchlistLoading) return;
//     setWatchlistLoading(true);
//     try {
//       if (isWatched) {
//         await removeFromWatchlist(accessToken, auction.property_id);
//         setIsWatched(false);
//       } else {
//         await addToWatchlist(accessToken, auction.property_id);
//         setIsWatched(true);
//       }
//     } catch {
//     } finally {
//       setWatchlistLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (!accessToken) return;
//     void listBids(accessToken, auctionId).then(setBids).catch(() => {});
//   }, [accessToken, auctionId, eventCount]);

//   async function submitBid(amount: string) {
//     if (!accessToken) return;
//     setBidError(null);
//     setIsBidding(true);
//     try {
//       await placeBid(accessToken, auctionId, { amount });
//       setCustomAmount("");
//     } catch (err) {
//       setBidError(
//         err instanceof ApiRequestError
//           ? { code: err.code, message: err.message }
//           : { code: "unknown_error", message: "Failed to place bid." },
//       );
//     } finally {
//       setIsBidding(false);
//     }
//   }

//   function handleCustomSubmit(event: React.FormEvent) {
//     event.preventDefault();
//     if (!customAmount) return;
//     void submitBid(Number(customAmount).toFixed(2));
//   }

//   if (!auction) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center p-6">
//         <div className="text-center">
//           <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
//             <Gavel size={20} className="animate-pulse text-neutral-400" />
//           </div>
//           <p className="mt-3 text-sm text-neutral-500">Connecting to auction room…</p>
//         </div>
//       </div>
//     );
//   }

//   const isLive = auction.status === "live";
//   const isEnded = auction.status === "ended";
//   const iWon = isEnded && !!auction.winner_id && auction.winner_id === session?.id;
//   const iLost = isEnded && !!auction.winner_id && auction.winner_id !== session?.id && canBid;

//   return (
//     // <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
//       <div className="h-screen overflow-hidden bg-neutral-50">
//   <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 p-4 sm:p-6">

//       {/* Top bar */}
//       <div className="flex items-center justify-between">
//         <Link
//           href="/browse-auctions"
//           className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
//         >
//           <ArrowLeft size={15} />
//           Back to Browse Auctions
//         </Link>

//         {auction?.property_id ? (
//           <button
//             type="button"
//             onClick={() => void toggleWatchlist()}
//             disabled={watchlistLoading}
//             title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
//             className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
//               isWatched
//                 ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
//                 : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
//             }`}
//           >
//             <Star size={15} fill={isWatched ? "currentColor" : "none"} />
//             {isWatched ? "Saved" : "Save to Watchlist"}
//           </button>
//         ) : null}
//       </div>

//       {/* Main layout: auction card + optional chat sidebar */}
//       <div className={`grid gap-5 ${canChat ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
//         <div className="min-w-0 space-y-5">
//           {/* Hero card */}
//           <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

//             {/* Image / gradient header */}
//             <div className="relative h-52 overflow-hidden bg-neutral-900">
//               {resolveMinioUrl(auction.image_url) ? (
//                 <img
//                   src={resolveMinioUrl(auction.image_url)!}
//                   alt={auction.title}
//                   className="h-full w-full object-contain opacity-70"
//                 />
//               ) : (
//                 <div className="flex h-full w-full items-center justify-center">
//                   <Package size={48} className="text-neutral-600" />
//                 </div>
//               )}
//               <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/30 to-transparent" />

//               <div className="absolute left-5 top-5">
//                 <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
//                   {auction.category_name}
//                 </span>
//               </div>

//               <div className="absolute right-5 top-5 flex items-center gap-2">
//                 {connectionState !== "live" && <ConnectionStatusBadge state={connectionState} />}
//                 {isLive && (
//                   <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
//                     <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
//                     Live
//                   </span>
//                 )}
//                 {isEnded && (
//                   <span className="rounded-full bg-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300">
//                     Ended
//                   </span>
//                 )}
//                 {!isLive && !isEnded && (
//                   <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
//                     Upcoming
//                   </span>
//                 )}
//               </div>

//               <div className="absolute bottom-5 left-5 right-5">
//                 <h1 className="text-2xl font-bold leading-tight text-white">{auction.title}</h1>
//                 {auction.address && (
//                   <p className="mt-1 text-sm text-white/70">{auction.address}</p>
//                 )}
//               </div>
//             </div>

//             {/* Stats row */}
//             <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 lg:grid-cols-4 lg:divide-y-0">
//               <div className="p-2">
//                 <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Current Bid</p>
//                 <p className="mt-2 text-1xl font-extrabold text-brand-600">{formatMoney(auction.current_bid)}</p>
//               </div>
//               <div className="p-2">
//                 <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Reserve Price</p>
//                 <p className="mt-2 text-1xl font-extrabold text-neutral-800">{formatMoney(auction.reserve_price)}</p>
//               </div>
//               <div className="p-2">
//                 <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Bidders</p>
//                 <p className="mt-2 flex items-center gap-1.5 text-2xl font-extrabold text-neutral-800">
//                   <Users size={18} className="text-neutral-400" />
//                   {auction.bidder_count}
//                 </p>
//               </div>
//               <div className="p-2">
//                 <p className="text-1xl font-semibold uppercase tracking-widest text-neutral-400">
//                   {isEnded ? "Ended" : "Time Left"}
//                 </p>
//                 <p className={`mt-2 flex items-center gap-1.5 text-1xl font-extrabold ${isLive ? "text-red-500" : "text-neutral-800"}`}>
//                   <Clock size={18} className={isLive ? "text-red-400" : "text-neutral-400"} />
//                   {isEnded ? "—" : countdown.label}
//                 </p>
//               </div>
//             </div>

//             {/* Access + Bidding */}
//             <div className="border-t border-neutral-100 p-6">
//               <div className="mb-5">
//                 <span className="flex w-fit items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
//                   {auction.room_access === "invite_only" ? <Lock size={11} /> : <Users size={11} />}
//                   {auction.room_access === "invite_only" ? "Invite Only" : "Open to Everyone"}
//                 </span>
//               </div>

//               {isEnded ? (
//                 <div>
//                   {iWon ? (
//                     <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
//                       <p className="text-lg font-bold text-green-700">🏆 Congratulations — You Won!</p>
//                       <p className="mt-1 text-sm text-green-600">
//                         You are the highest bidder. Our team will contact you shortly to complete the purchase.
//                       </p>
//                     </div>
//                   ) : iLost ? (
//                     <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
//                       <p className="text-base font-semibold text-red-700">You didn&apos;t win this auction.</p>
//                       <p className="mt-1 text-sm text-red-500">
//                         Another bidder placed a higher bid. Browse more auctions to find your next opportunity.
//                       </p>
//                       <Link
//                         href="/browse-auctions"
//                         className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
//                       >
//                         Browse More Auctions
//                       </Link>
//                     </div>
//                   ) : (
//                     <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
//                       This auction has ended{auction.winner_id ? " and a winner has been selected." : "."}
//                     </div>
//                   )}
//                 </div>
//               ) : !isLive ? (
//                 <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
//                   This auction hasn&apos;t started yet — bidding opens once it goes live.
//                 </div>
//               ) : !canBid ? (
//                 <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
//                   <AlertCircle size={15} /> Only buyer accounts can place bids in this room.
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Quick Bid</p>
//                   <QuickBidButtons
//                     currentBid={auction.current_bid}
//                     openingBid={auction.opening_bid}
//                     increments={auction.increments}
//                     disabled={isBidding}
//                     onBid={submitBid}
//                   />
//                   <form onSubmit={handleCustomSubmit} className="flex gap-2">
//                     <input
//                       type="number"
//                       value={customAmount}
//                       onChange={(e) => setCustomAmount(e.target.value)}
//                       placeholder={`Minimum ${formatMoney(auction.minimum_bid)}`}
//                       disabled={isBidding}
//                       className="h-12 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
//                     />
//                     <button
//                       type="submit"
//                       disabled={isBidding || !customAmount}
//                       className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
//                     >
//                       <Gavel size={15} />
//                       {isBidding ? "Placing…" : "Place Bid"}
//                     </button>
//                   </form>
//                   {bidError ? (
//                     bidError.code === "kyc_required" ? (
//                       <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
//                         <AlertCircle size={15} />
//                         Verify your identity before bidding.{" "}
//                         <Link href="/kyc" className="font-medium underline underline-offset-2">Complete KYC</Link>
//                       </div>
//                     ) : (
//                       <p className="text-sm text-red-600">{bidError.message}</p>
//                     )
//                   ) : null}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Activity */}
//           <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
//             <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Activity</h2>
//             <div className="mt-4">
//               <BidHistoryList bids={bids} currentUserId={session?.id} />
//             </div>
//           </div>
//         </div>

//         {/* Chat — buyers only, sellers excluded.
//             On mobile: full-width card below the auction.
//             On lg+: sticky sidebar to the right. */}
//         {canChat && (
//           <div className="h-[480px] lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
//             <BiddingChatPanel
//               messages={chatMessages}
//               currentUserId={session?.id}
//               canSend={isLive && canBid}
//               onSend={sendChat}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//     </div>
//   );
// }












"use client";

import { AlertCircle, ArrowLeft, Clock, Gavel, Lock, Package, Star, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BiddingChatPanel } from "@/components/bidding/BiddingChatPanel";
import { ConnectionStatusBadge } from "@/components/bidding/ConnectionStatusBadge";
import { QuickBidButtons } from "@/components/bidding/QuickBidButtons";
import { BidHistoryList } from "@/components/bidding/BidHistoryList";
import { placeBid, listBids } from "@/lib/api/bids";
import { ApiRequestError } from "@/lib/api/client";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/lib/api/watchlist";
import { useBiddingRoom } from "@/lib/hooks/useBiddingRoom";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import type { Bid } from "@/types/bid";
import toast from "react-hot-toast";
function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

export default function LiveBiddingRoomPage() {
  const params = useParams<{ id: string }>();
  const auctionId = params.id;
  const { accessToken, session } = useAuth();

  const { auction, connectionState, eventCount, chatMessages, sendChat } = useBiddingRoom(
    auctionId,
    accessToken,
  );
  const countdown = useCountdown(auction?.ends_at ?? new Date().toISOString());

  const [bids, setBids] = useState<Bid[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<{ code: string; message: string } | null>(null);

  const [isWatched, setIsWatched] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const isBuyer = session?.roles.includes("buyer") ?? false;
  const isSeller = session?.roles.includes("seller") ?? false;
  const canBid = isBuyer && !!session && can(session.permissions, "bid_management", "full");
  const canChat = isBuyer && !isSeller;

  useEffect(() => {
    if (!accessToken || !auction?.property_id) return;
    listWatchlist(accessToken)
      .then((items) => setIsWatched(items.some((i) => i.property.id === auction.property_id)))
      .catch(() => {});
  }, [accessToken, auction?.property_id]);


  async function toggleWatchlist() {
  if (!accessToken || !auction?.property_id || watchlistLoading) return;

  setWatchlistLoading(true);

  try {
    if (isWatched) {
      await removeFromWatchlist(accessToken, auction.property_id);
      setIsWatched(false);
      toast.success("Removed from watchlist");
    } else {
      await addToWatchlist(accessToken, auction.property_id);
      setIsWatched(true);
      toast.success("Saved to watchlist");
    }
  } catch {
    toast.error("Unable to update watchlist");
  } finally {
    setWatchlistLoading(false);
  }
}

  useEffect(() => {
    if (!accessToken) return;
    void listBids(accessToken, auctionId).then(setBids).catch(() => {});
  }, [accessToken, auctionId, eventCount]);

async function submitBid(amount: string) {
  if (!accessToken) return;

  setBidError(null);
  setIsBidding(true);

  try {
    await placeBid(accessToken, auctionId, { amount });

    setCustomAmount("");

    // ✅ Success Toast
    toast.success("Bid placed successfully!");
  } catch (err) {
    const error =
      err instanceof ApiRequestError
        ? { code: err.code, message: err.message }
        : { code: "unknown_error", message: "Failed to place bid." };

    setBidError(error);

    // ✅ Error Toast
    toast.error(error.message);
  } finally {
    setIsBidding(false);
  }
}
  function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!customAmount) return;
    void submitBid(Number(customAmount).toFixed(2));
  }

  if (!auction) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Gavel size={20} className="animate-pulse text-neutral-400" />
          </div>
          <p className="mt-3 text-sm text-neutral-500">Connecting to auction room…</p>
        </div>
      </div>
    );
  }

  const isLive = auction.status === "live";
  const isEnded = auction.status === "ended";
  const iWon = isEnded && !!auction.winner_id && auction.winner_id === session?.id;
  const iLost = isEnded && !!auction.winner_id && auction.winner_id !== session?.id && canBid;

  return (
    // Normal scrolling page. The fixed h-screen/overflow-hidden shell was
    // clipping Activity off-screen whenever the hero card was tall, since
    // Row 1's natural height could eat the whole viewport. Letting the
    // page scroll guarantees Activity is always fully reachable — its own
    // max-h-[300px] + overflow-y-auto still keeps ITS internal list short,
    // just the outer page itself isn't artificially capped anymore.
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/browse-auctions"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft size={15} />
            Back to Browse Auctions
          </Link>

          {auction?.property_id ? (
            <button
              type="button"
              onClick={() => void toggleWatchlist()}
              disabled={watchlistLoading}
              title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                isWatched
                  ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Star size={15} fill={isWatched ? "currentColor" : "none"} />
              {isWatched ? "Saved" : "Save to Watchlist"}
            </button>
          ) : null}
        </div>

        {/* Row 1: auction card + optional chat sidebar, side by side */}
        <div
          className={`grid gap-5 ${
            canChat ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""
          }`}
        >
          <div className="min-w-0">
            {/* Hero card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {/* Image / gradient header */}
              <div className="relative h-52 overflow-hidden bg-neutral-900">
                {resolveMinioUrl(auction.image_url) ? (
                  <img
                    src={resolveMinioUrl(auction.image_url)!}
                    alt={auction.title}
                    className="h-full w-full object-scale-down opacity-70"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package size={48} className="text-neutral-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/10 via-neutral-900/10 to-transparent" />

                <div className="absolute left-5 top-5">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                    {auction.category_name}
                  </span>
                </div>

                <div className="absolute right-5 top-5 flex items-center gap-2">
                  {connectionState !== "live" && <ConnectionStatusBadge state={connectionState} />}
                  {isLive && (
                    <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      Live
                    </span>
                  )}
                  {isEnded && (
                    <span className="rounded-full bg-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300">
                      Ended
                    </span>
                  )}
                  {!isLive && !isEnded && (
                    <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
                      Upcoming
                    </span>
                  )}
                </div>


                <div className="absolute bottom-5 left-5 right-5">
                  <h1 className="text-2xl font-bold leading-tight text-white">{auction.title}</h1>
                  {auction.address && (
                    <p className="mt-1 text-sm text-white/70">{auction.address}</p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 lg:grid-cols-4 lg:divide-y-0">
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Current Bid</p>
                  <p className="mt-2 text-1xl font-extrabold text-brand-600">{formatMoney(auction.current_bid)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Reserve Price</p>
                  <p className="mt-2 text-1xl font-extrabold text-neutral-800">{formatMoney(auction.reserve_price)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Bidders</p>
                  <p className="mt-2 flex items-center gap-1.5 text-1xl font-extrabold text-neutral-800">
                    <Users size={18} className="text-neutral-400" />
                    {auction.bidder_count}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    {isEnded ? "Ended" : "Time Left"}
                  </p>
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-1xl font-extrabold ${
                      isLive ? "text-red-500" : "text-neutral-800"
                    }`}
                  >
                    <Clock size={18} className={isLive ? "text-red-400" : "text-neutral-400"} />
                    {isEnded ? "—" : countdown.label}
                  </p>
                </div>
              </div>

              {/* Access + Bidding */}
              <div className="border-t border-neutral-100 p-6">
                <div className="mb-5">
                  <span className="flex w-fit items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                    {auction.room_access === "invite_only" ? <Lock size={11} /> : <Users size={11} />}
                    {auction.room_access === "invite_only" ? "Invite Only" : "Open to Everyone"}
                  </span>
                </div>

                {isEnded ? (
                  <div>
                    {iWon ? (
                      <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
                        <p className="text-lg font-bold text-green-700">🏆 Congratulations — You Won!</p>
                        <p className="mt-1 text-sm text-green-600">
                          You are the highest bidder. Our team will contact you shortly to complete the purchase.
                        </p>
                      </div>
                    ) : iLost ? (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
                        <p className="text-base font-semibold text-red-700">You didn&apos;t win this auction.</p>
                        <p className="mt-1 text-sm text-red-500">
                          Another bidder placed a higher bid. Browse more auctions to find your next opportunity.
                        </p>
                        <Link
                          href="/browse-auctions"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Browse More Auctions
                        </Link>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-neutral-50 px-4 py-1 text-sm text-neutral-600">
                        This auction has ended{auction.winner_id ? " and a winner has been selected." : "."}
                      </div>
                    )}
                  </div>
                ) : !isLive ? (
                  <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    This auction hasn&apos;t started yet — bidding opens once it goes live.
                  </div>
                ) : !canBid ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <AlertCircle size={15} /> Only buyer accounts can place bids in this room.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Quick Bid</p>
                    <QuickBidButtons
                      currentBid={auction.current_bid}
                      openingBid={auction.opening_bid}
                      increments={auction.increments}
                      disabled={isBidding}
                      onBid={submitBid}
                    />
                    <form onSubmit={handleCustomSubmit} className="flex gap-2">
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder={`Minimum ${formatMoney(auction.minimum_bid)}`}
                        disabled={isBidding}
                        className="h-12 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                      <button
                        type="submit"
                        disabled={isBidding || !customAmount}
                        className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                      >
                        <Gavel size={15} />
                        {isBidding ? "Placing…" : "Place Bid"}
                      </button>
                    </form>
                    {bidError ? (
                      bidError.code === "kyc_required" ? (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                          <AlertCircle size={15} />
                          Verify your identity before bidding.{" "}
                          <Link href="/kyc" className="font-medium underline underline-offset-2">
                            Complete KYC
                          </Link>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">{bidError.message}</p>
                      )
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat — buyers only, sellers excluded.
              h-full stretches this to match the hero card's height —
              grid rows stretch children to the tallest item by default,
              so this now bottom-aligns with "Place Bid" automatically. */}
          {canChat && (
            <div className="h-full min-h-0">
              <BiddingChatPanel
                messages={chatMessages}
                currentUserId={session?.id}
                canSend={isLive && canBid}
                onSend={sendChat}
              />
            </div>
          )}
        </div>

        {/* Row 2: Activity — full width, below both the hero card and chat.
            Capped to a fixed max-height instead of flex-1, so it only
            takes the space it needs. Internal scroll (scrollbar hidden)
            only kicks in once the bid list exceeds that height. */}
        {/* Row 2: Activity — full width, below both the hero card and chat.
            340px comfortably fits header + ~3 bid rows before the internal
            scroll (scrollbar hidden) kicks in for anything beyond that. */}
        <div className=" max-h-[340px]  rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Activity</h2>
          <div className="mt-4">
            <BidHistoryList bids={bids} currentUserId={session?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
