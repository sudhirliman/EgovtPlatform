import React, { useState } from "react";
import { ticketsApi } from "../api/client";
import { PageHeader, Card, Button, Input, Table, Badge, ErrorBanner } from "../components/ui.jsx";

const STATUS_TONE = { OPEN: "warning", IN_PROGRESS: "warning", RESOLVED: "success", REOPENED: "danger", CLOSED: "default" };

export default function TicketsPage() {
  const [userId, setUserId] = useState("");
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    if (!userId) return;
    try {
      setTickets(await ticketsApi.listMine(userId));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <PageHeader title="Support tickets" subtitle="Citizen queries, optionally linked to a specific application" />
      <ErrorBanner message={error} />

      <Card className="mb-4">
        <div className="flex items-end gap-2">
          <Input label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="paste a user UUID" className="w-96" />
          <Button onClick={load}>Load tickets</Button>
        </div>
      </Card>

      <Card>
        <Table
          emptyText="No tickets found"
          columns={[
            { key: "ticketNo", header: "Ticket no" },
            { key: "subject", header: "Subject" },
            { key: "priority", header: "Priority" },
            { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status] || "default"}>{r.status}</Badge> },
          ]}
          rows={tickets}
        />
      </Card>
    </div>
  );
}
