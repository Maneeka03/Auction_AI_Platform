"use client";

import { Campaign } from "./mockCampaigns";
import CampaignStatusBadge from "./CampaignStatusBadge";
import { MoreHorizontal } from "lucide-react";

interface Props {
  campaigns: Campaign[];
}

export default function CampaignTable({ campaigns }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Campaign
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Audience
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Type
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Recipients
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Status
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Open Rate
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold">
              Created
            </th>

            <th className="px-6 py-4 text-right text-sm font-semibold">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {campaigns.map((campaign) => (
            <tr
              key={campaign.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-6 py-4">
                <div className="font-medium">
                  {campaign.name}
                </div>

                <div className="text-sm text-gray-500">
                  {campaign.subject}
                </div>
              </td>

              <td className="px-6 py-4">
                {campaign.audience}
              </td>

              <td className="px-6 py-4">
                {campaign.type}
              </td>

              <td className="px-6 py-4">
                {campaign.recipients.toLocaleString()}
              </td>

              <td className="px-6 py-4">
                <CampaignStatusBadge
                  status={campaign.status}
                />
              </td>

              <td className="px-6 py-4">
                {campaign.openRate}%
              </td>

              <td className="px-6 py-4">
                {campaign.createdAt}
              </td>

              <td className="px-6 py-4 text-right">

                <button className="rounded-md p-2 hover:bg-gray-100">

                  <MoreHorizontal size={18} />

                </button>

              </td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}