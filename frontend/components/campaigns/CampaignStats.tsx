"use client";

import { Megaphone, PlayCircle, CalendarClock, CheckCircle2 } from "lucide-react";

interface Props {
  total: number;
  running: number;
  scheduled: number;
  completed: number;
}

const cards = [
  {
    key: "total",
    title: "Campaigns",
    icon: Megaphone,
  },
  {
    key: "running",
    title: "Running",
    icon: PlayCircle,
  },
  {
    key: "scheduled",
    title: "Scheduled",
    icon: CalendarClock,
  },
  {
    key: "completed",
    title: "Completed",
    icon: CheckCircle2,
  },
];

export default function CampaignStats(props: Props) {
  const values = {
    total: props.total,
    running: props.running,
    scheduled: props.scheduled,
    completed: props.completed,
  };

  return (
    <div className="grid gap-5 lg:grid-cols-4">
      {cards.map(card => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="rounded-2xl border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {card.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  {values[card.key as keyof typeof values]}
                </h2>
              </div>

              <div className="rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}