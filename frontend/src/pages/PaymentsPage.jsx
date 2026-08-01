import React, { useState } from "react";
import { paymentsApi } from "../api/client";
import { PageHeader, Card, Button, Input, Table, Badge, ErrorBanner } from "../components/ui.jsx";

export default function PaymentsPage() {
  const [applicationId, setApplicationId] = useState("");
  const [challans, setChallans] = useState([]);
  const [allSettled, setAllSettled] = useState(null);
  const [error, setError] = useState("");
  const [newChallan, setNewChallan] = useState({ amount: "", purpose: "" });

  async function load() {
    if (!applicationId) return;
    try {
      const [list, settled] = await Promise.all([
        paymentsApi.listChallans(applicationId),
        paymentsApi.allSettled(applicationId),
      ]);
      setChallans(list);
      setAllSettled(settled);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function generate(e) {
    e.preventDefault();
    try {
      await paymentsApi.generateChallan({
        applicationId,
        amount: Number(newChallan.amount),
        purpose: newChallan.purpose,
        generatedByUserId: null,
        generatedAtStageId: null,
        parentChallanId: null,
      });
      setNewChallan({ amount: "", purpose: "" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <PageHeader title="Payments" subtitle="Multi-challan status for an application - online + offline" />
      <ErrorBanner message={error} />

      <Card className="mb-4">
        <div className="flex items-end gap-2">
          <Input
            label="Application ID"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="paste an application UUID"
            className="w-96"
          />
          <Button onClick={load}>Load</Button>
        </div>
      </Card>

      {challans.length > 0 || allSettled !== null ? (
        <>
          <Card className="mb-4">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-slate-600">Gate status:</span>
              {allSettled ? (
                <Badge tone="success">All challans settled - can proceed</Badge>
              ) : (
                <Badge tone="danger">Payment pending - blocked from next stage</Badge>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="mb-3 text-[13px] font-medium text-slate-900">Challans</div>
              <Table
                emptyText="No challans yet"
                columns={[
                  { key: "challanNo", header: "Challan no" },
                  { key: "amount", header: "Amount", render: (r) => `\u20B9${r.amount}` },
                  { key: "purpose", header: "Purpose" },
                  {
                    key: "status",
                    header: "Status",
                    render: (r) => (
                      <Badge tone={r.status === "PAID" ? "success" : r.status === "CANCELLED" ? "default" : "warning"}>
                        {r.status}
                      </Badge>
                    ),
                  },
                ]}
                rows={challans}
              />
            </Card>

            <Card>
              <div className="mb-3 text-[13px] font-medium text-slate-900">Generate new challan</div>
              <form onSubmit={generate} className="flex flex-col gap-2">
                <Input
                  label="Amount"
                  type="number"
                  value={newChallan.amount}
                  onChange={(e) => setNewChallan({ ...newChallan, amount: e.target.value })}
                  required
                />
                <Input
                  label="Purpose"
                  value={newChallan.purpose}
                  onChange={(e) => setNewChallan({ ...newChallan, purpose: e.target.value })}
                  placeholder="e.g. Additional fee - senior authority"
                  required
                />
                <Button type="submit">Generate challan</Button>
              </form>
              <p className="mt-3 text-xs text-slate-400">
                Multiple challans can exist per application - the application stays blocked at the payment-check
                stage until every one of them is PAID or CANCELLED.
              </p>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
