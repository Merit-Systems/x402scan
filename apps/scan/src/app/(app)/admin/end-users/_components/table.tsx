"use client";

import { useState } from "react";
import { LoadableDataTable } from "@/app/(app)/admin/_components/loadable-data-table";
import { columns } from "./columns";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface EndUserCSVRow {
  userId: string;
  email: string;
  phoneNumber: string;
  jwtSub: string;
  evmAccounts: string;
  evmSmartAccounts: string;
  solanaAccounts: string;
  createdAt: string;
}

const convertToCSV = (data: EndUserCSVRow[]): string => {
  if (data.length === 0) return "";

  const headers: (keyof EndUserCSVRow)[] = [
    "userId",
    "email",
    "phoneNumber",
    "jwtSub",
    "evmAccounts",
    "evmSmartAccounts",
    "solanaAccounts",
    "createdAt",
  ];
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
};

const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const EndUsersTable = () => {
  const [downloading, setDownloading] = useState(false);

  const { data: endUsers, isLoading } = api.admin.endUsers.list.useQuery();

  const handleDownloadCSV = () => {
    if (!endUsers || endUsers.length === 0) return;

    setDownloading(true);

    const csvData = endUsers.map((user) => ({
      userId: user.userId,
      email:
        user.authenticationMethods.find((m) => m.type === "email")?.email ?? "",
      phoneNumber:
        user.authenticationMethods.find((m) => m.type === "sms")?.phoneNumber ??
        "",
      jwtSub:
        user.authenticationMethods.find((m) => m.type === "jwt")?.sub ?? "",
      evmAccounts: user.evmAccounts.join("; "),
      evmSmartAccounts: user.evmSmartAccounts.join("; "),
      solanaAccounts: user.solanaAccounts.join("; "),
      createdAt: user.createdAt,
    }));

    const csv = convertToCSV(csvData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadCSV(csv, `end-users-${timestamp}.csv`);

    setDownloading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="type-supporting-body text-muted-foreground">
          {endUsers ? `${String(endUsers.length)} end users` : "Loading..."}
        </div>
        <Button
          onClick={handleDownloadCSV}
          disabled={!endUsers || endUsers.length === 0 || downloading}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 size-4" />
          Download CSV
        </Button>
      </div>

      <LoadableDataTable
        columns={columns}
        data={endUsers ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.userId}
      />
    </div>
  );
};
