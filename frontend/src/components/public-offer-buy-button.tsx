"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureActiveSession } from "@/lib/auth";
import { euroToXof } from "@/lib/currency";
export function PublicOfferBuyButton({serviceSlug,title,price}:{serviceSlug:string;title:string;price:number}){const router=useRouter();const [busy,setBusy]=useState(false);async function buy(){setBusy(true);const pay=`/paiement?service=${encodeURIComponent(serviceSlug)}&amount=${euroToXof(price)}&reason=${encodeURIComponent(`Achat ${title} — PieAgency`)}`;const session=await ensureActiveSession();router.push(session?pay:`/connexion?mode=sign-up&next=${encodeURIComponent(pay)}`);}return <button className="offers-buy-btn" disabled={busy} onClick={buy} type="button">{busy?"Préparation…":"Acheter maintenant"}</button>}
