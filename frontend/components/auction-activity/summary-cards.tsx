import {
  Clock3,
  Gavel,
  HandCoins,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

const stats = [
  {
    title: "Live Auctions",
    value: "18",
    change: "+2 from yesterday",
    icon: Gavel,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Active Bidders",
    value: "326",
    change: "+14%",
    icon: Users,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    title: "Total Bids",
    value: "1,842",
    change: "+8%",
    icon: HandCoins,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    title: "Ending Soon",
    value: "5",
    change: "Next 30 min",
    icon: Clock3,
    color: "text-red-600",
    bg: "bg-red-100",
  },
  {
    title: "Highest Bid",
    value: "$2.4M",
    change: "Luxury Villa",
    icon: Trophy,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  {
    title: "Today's Volume",
    value: "$8.7M",
    change: "+22%",
    icon: TrendingUp,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
];

export function SummaryCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className="transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {item.title}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {item.value}
                  </h2>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.change}
                  </p>
                </div>

                <div
                  className={`rounded-xl p-3 ${item.bg}`}
                >
                  <Icon
                    className={`h-6 w-6 ${item.color}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}