interface Props {
  status: "Draft" | "Scheduled" | "Running" | "Paused" | "Completed";
}

const styles = {
  Draft: "bg-gray-100 text-gray-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Running: "bg-green-100 text-green-700",
  Paused: "bg-yellow-100 text-yellow-700",
  Completed: "bg-purple-100 text-purple-700",
};

export default function CampaignStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}